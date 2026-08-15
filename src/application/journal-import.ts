import { strFromU8, unzipSync } from "fflate";
import { z } from "zod";
import { DaySchema } from "@/domain/day";
import { MomentSchema } from "@/domain/moment";
import { JournalEntrySchema } from "@/domain/journal-entry";
import { MediaReferenceSchema } from "@/domain/media";
import { ReflectionSchema } from "@/domain/reflection";
import { UserPreferencesSchema } from "@/domain/preferences";
import { DoodleSchema, HiddenMemorySchema, KeepsakeSchema } from "@/domain/personal-world";
import {
  EntityIdSchema,
  IsoTimestampSchema,
  LocalDateSchema,
  newEntityId,
  nowIso,
} from "@/domain/shared";
import { OutboxOperationSchema, type OutboxOperation } from "@/domain/sync";
import { EXPORT_FORMAT_VERSION } from "@/application/journal-export";
import type { JournalDatabase } from "@/infrastructure/local/database";
import { refreshDayDerived } from "@/infrastructure/local/derived-indexes";

const MAX_ARCHIVE_BYTES = 256 * 1024 * 1024;
const MAX_JSON_BYTES = 32 * 1024 * 1024;
const MAX_FILES = 20_000;
const MAX_EXPANDED_BYTES = 1024 * 1024 * 1024;
const common = z.object({ id: EntityIdSchema, userId: EntityIdSchema });
const syncFields = {
  version: z.number().int().nonnegative(),
  syncState: z.enum(["local", "pending", "synced", "failed", "conflict"]),
  deletedAt: IsoTimestampSchema.nullable(),
};
const TrackerDefinitionSchema = common.extend({
  name: z.string().min(1).max(120),
  description: z.string().max(2_000),
  type: z.enum(["yes_no", "count", "number", "scale", "duration", "short_text", "single_select"]),
  options: z.array(z.string().max(120)).max(100),
  unit: z.string().max(80),
  pinned: z.boolean(),
  archivedAt: IsoTimestampSchema.nullable(),
  createdAt: IsoTimestampSchema,
  updatedAt: IsoTimestampSchema,
  ...syncFields,
});
const TrackerEntrySchema = common.extend({
  trackerId: EntityIdSchema,
  dayId: EntityIdSchema,
  localDate: LocalDateSchema,
  value: z.union([z.boolean(), z.number(), z.string().max(2_000)]),
  note: z.string().max(2_000),
  occurredAt: IsoTimestampSchema,
  createdAt: IsoTimestampSchema,
  updatedAt: IsoTimestampSchema,
  ...syncFields,
});
const MonthlyReflectionSchema = common.extend({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  body: z.string().max(100_000),
  createdAt: IsoTimestampSchema,
  updatedAt: IsoTimestampSchema,
  ...syncFields,
});
const BookmarkSchema = common.extend({
  journalEntryId: EntityIdSchema,
  createdAt: IsoTimestampSchema,
  ...syncFields,
});
const ArchiveSchema = z.object({
  manifest: z
    .object({
      format: z.literal("campus-atelier-journal-export"),
      formatVersion: z.literal(EXPORT_FORMAT_VERSION),
      exportedAt: IsoTimestampSchema,
    })
    .passthrough(),
  data: z.object({
    days: z.array(DaySchema).max(10_000),
    moments: z.array(MomentSchema).max(100_000),
    journalEntries: z.array(JournalEntrySchema).max(20_000),
    reflections: z.array(ReflectionSchema).max(20_000),
    media: z.array(MediaReferenceSchema).max(20_000),
    preferences: UserPreferencesSchema.nullable(),
    trackerDefinitions: z.array(TrackerDefinitionSchema).max(5_000),
    trackerEntries: z.array(TrackerEntrySchema).max(100_000),
    monthlyReflections: z.array(MonthlyReflectionSchema).max(5_000),
    keepsakes: z.array(KeepsakeSchema).max(20_000),
    doodles: z.array(DoodleSchema.omit({ previewDataUrl: true })).max(20_000),
    bookmarks: z.array(BookmarkSchema).max(20_000),
    hiddenMemories: z.array(HiddenMemorySchema).max(20_000),
  }),
});

export type ImportInspection = {
  archive: z.infer<typeof ArchiveSchema>;
  files: Record<string, Uint8Array>;
  summary: {
    days: number;
    moments: number;
    journals: number;
    photos: number;
    doodles: number;
    exportedAt: string;
  };
};

export interface ImportResult {
  imported: number;
  preservedConflicts: number;
  skippedPreferences: boolean;
  missingMedia: number;
}

export class JournalImportService {
  constructor(private readonly database: JournalDatabase) {}

  async inspect(file: File): Promise<ImportInspection> {
    if (file.size > MAX_ARCHIVE_BYTES)
      throw new Error("That archive is too large for safe browser restore.");
    const input = new Uint8Array(await file.arrayBuffer());
    let files: Record<string, Uint8Array>;
    if (file.name.toLowerCase().endsWith(".json")) files = { "data/journal.json": input };
    else {
      try {
        files = unzipSync(input);
      } catch {
        throw new Error("That ZIP could not be read safely.");
      }
    }
    const names = Object.keys(files);
    if (names.length > MAX_FILES || names.some(unsafePath))
      throw new Error("That archive contains unsafe file paths or too many files.");
    const expanded = Object.values(files).reduce((sum, value) => sum + value.byteLength, 0);
    if (expanded > MAX_EXPANDED_BYTES)
      throw new Error("That archive expands beyond the safe restore limit.");
    const journal = files["data/journal.json"];
    if (!journal || journal.byteLength > MAX_JSON_BYTES)
      throw new Error("The versioned journal data is missing or too large.");
    let parsed: unknown;
    try {
      parsed = JSON.parse(strFromU8(journal));
    } catch {
      throw new Error("The journal data is not valid JSON.");
    }
    const result = ArchiveSchema.safeParse(parsed);
    if (!result.success) throw new Error("This is not a supported Campus Atelier 1.0 archive.");
    const data = result.data.data;
    return {
      archive: result.data,
      files,
      summary: {
        days: data.days.length,
        moments: data.moments.length,
        journals: data.journalEntries.length,
        photos: data.media.length,
        doodles: data.doodles.length,
        exportedAt: result.data.manifest.exportedAt,
      },
    };
  }

  async restore(userId: string, inspection: ImportInspection): Promise<ImportResult> {
    const source = inspection.archive.data;
    const maps = {
      days: await collisionMap(this.database.days, source.days),
      moments: await collisionMap(this.database.moments, source.moments),
      journals: await collisionMap(this.database.journalEntries, source.journalEntries),
      media: await collisionMap(this.database.media, source.media),
      reflections: await collisionMap(this.database.reflections, source.reflections),
      trackerDefinitions: await collisionMap(
        this.database.trackerDefinitions,
        source.trackerDefinitions,
      ),
      trackerEntries: await collisionMap(this.database.trackerEntries, source.trackerEntries),
      monthlyReflections: await collisionMap(
        this.database.monthlyReflections,
        source.monthlyReflections,
      ),
      keepsakes: await collisionMap(this.database.keepsakes, source.keepsakes),
      doodles: await collisionMap(this.database.doodles, source.doodles),
      bookmarks: await collisionMap(this.database.bookmarks, source.bookmarks),
      hiddenMemories: await collisionMap(this.database.hiddenMemories, source.hiddenMemories),
    };
    const remap = (map: Map<string, string>, id: string) => map.get(id) ?? id;
    const days = source.days.map((item) => ({
      ...item,
      id: remap(maps.days, item.id),
      userId,
      version: 0,
      syncState: "pending" as const,
    }));
    const moments = source.moments.map((item) => ({
      ...item,
      id: remap(maps.moments, item.id),
      userId,
      dayId: remap(maps.days, item.dayId),
      content:
        item.content.kind === "photo"
          ? { ...item.content, mediaId: remap(maps.media, item.content.mediaId) }
          : item.content.kind === "journal"
            ? { ...item.content, journalEntryId: remap(maps.journals, item.content.journalEntryId) }
            : item.content.kind === "doodle"
              ? { ...item.content, doodleId: remap(maps.doodles, item.content.doodleId) }
              : item.content,
      version: 0,
      syncState: "pending" as const,
    }));
    const journals = source.journalEntries.map((item) => ({
      ...item,
      id: remap(maps.journals, item.id),
      userId,
      dayId: remap(maps.days, item.dayId),
      version: 0,
      syncState: "pending" as const,
    }));
    let missingMedia = 0;
    const media = source.media.map((item) => {
      const entry = Object.entries(inspection.files).find(([name]) =>
        name.startsWith(`media/${item.id}.`),
      );
      if (!entry) missingMedia += 1;
      const blob = entry ? new Blob([entry[1] as BlobPart], { type: item.mimeType }) : null;
      return {
        ...item,
        id: remap(maps.media, item.id),
        userId,
        dayId: remap(maps.days, item.dayId),
        momentId: item.momentId ? remap(maps.moments, item.momentId) : null,
        blob,
        byteSize: blob?.size ?? item.byteSize,
        objectKey: null,
        status: blob ? ("local" as const) : ("failed" as const),
        version: 0,
        syncState: "pending" as const,
      };
    });
    const reflections = source.reflections.map((item) => ({
      ...item,
      id: remap(maps.reflections, item.id),
      userId,
      dayId: remap(maps.days, item.dayId),
      version: 0,
      syncState: "pending" as const,
    }));
    const trackerDefinitions = source.trackerDefinitions.map((item) => ({
      ...item,
      id: remap(maps.trackerDefinitions, item.id),
      userId,
      version: 0,
      syncState: "pending" as const,
    }));
    const trackerEntries = source.trackerEntries.map((item) => ({
      ...item,
      id: remap(maps.trackerEntries, item.id),
      userId,
      trackerId: remap(maps.trackerDefinitions, item.trackerId),
      dayId: remap(maps.days, item.dayId),
      version: 0,
      syncState: "pending" as const,
    }));
    const monthlyReflections = source.monthlyReflections.map((item) => ({
      ...item,
      id: remap(maps.monthlyReflections, item.id),
      userId,
      version: 0,
      syncState: "pending" as const,
    }));
    const keepsakes = source.keepsakes.map((item) => ({
      ...item,
      id: remap(maps.keepsakes, item.id),
      userId,
      dayId: item.dayId ? remap(maps.days, item.dayId) : null,
      sourceId: remapSource(item.sourceType, item.sourceId, maps),
      version: 0,
      syncState: "pending" as const,
    }));
    const doodles = source.doodles.map((item) => {
      const file = inspection.files[`media/doodles/${item.id}.png`];
      return {
        ...item,
        id: remap(maps.doodles, item.id),
        userId,
        dayId: remap(maps.days, item.dayId),
        previewDataUrl: file ? `data:image/png;base64,${bytesToBase64(file)}` : "",
        version: 0,
        syncState: "pending" as const,
      };
    });
    const bookmarks = source.bookmarks.map((item) => ({
      ...item,
      id: remap(maps.bookmarks, item.id),
      userId,
      journalEntryId: remap(maps.journals, item.journalEntryId),
      version: 0,
      syncState: "pending" as const,
    }));
    const hiddenMemories = source.hiddenMemories.map((item) => ({
      ...item,
      id: remap(maps.hiddenMemories, item.id),
      userId,
      dayId: remap(maps.days, item.dayId),
      version: 0,
      syncState: "pending" as const,
    }));
    const operations = [
      ...days.map((record) => operation("day", record)),
      ...moments.map((record) => operation("moment", record)),
      ...journals.map((record) => operation("journal_entry", record)),
      ...media.map((record) => operation("media", record)),
      ...reflections.map((record) => operation("reflection", record)),
      ...trackerDefinitions.map((record) => operation("tracker_definition", record)),
      ...trackerEntries.map((record) => operation("tracker_entry", record)),
      ...monthlyReflections.map((record) => operation("monthly_reflection", record)),
      ...keepsakes.map((record) => operation("keepsake", record)),
      ...doodles.map((record) => operation("doodle", record)),
      ...bookmarks.map((record) => operation("bookmark", record)),
      ...hiddenMemories.map((record) => operation("hidden_memory", record)),
    ];
    const tables = [
      this.database.days,
      this.database.moments,
      this.database.journalEntries,
      this.database.media,
      this.database.reflections,
      this.database.trackerDefinitions,
      this.database.trackerEntries,
      this.database.monthlyReflections,
      this.database.keepsakes,
      this.database.doodles,
      this.database.bookmarks,
      this.database.hiddenMemories,
      this.database.outbox,
    ];
    await this.database.transaction("rw", tables, async () => {
      await this.database.days.bulkPut(days);
      await this.database.moments.bulkPut(moments);
      await this.database.journalEntries.bulkPut(journals);
      await this.database.media.bulkPut(media);
      await this.database.reflections.bulkPut(reflections);
      await this.database.trackerDefinitions.bulkPut(trackerDefinitions);
      await this.database.trackerEntries.bulkPut(trackerEntries);
      await this.database.monthlyReflections.bulkPut(monthlyReflections);
      await this.database.keepsakes.bulkPut(keepsakes);
      await this.database.doodles.bulkPut(doodles);
      await this.database.bookmarks.bulkPut(bookmarks);
      await this.database.hiddenMemories.bulkPut(hiddenMemories);
      await this.database.outbox.bulkAdd(operations);
    });
    const existingPreferences = await this.database.preferences.get(userId);
    if (!existingPreferences && source.preferences) {
      const preference = {
        ...source.preferences,
        userId,
        version: 0,
        syncState: "pending" as const,
      };
      await this.database.transaction(
        "rw",
        [this.database.preferences, this.database.outbox],
        async () => {
          await this.database.preferences.put(preference);
          await this.database.outbox.add(operation("preferences", preference));
        },
      );
    }
    for (const day of days) await refreshDayDerived(this.database, userId, day.id);
    const conflicts = Object.values(maps).reduce((sum, map) => sum + map.size, 0);
    return {
      imported:
        days.length +
        moments.length +
        journals.length +
        media.length +
        reflections.length +
        trackerDefinitions.length +
        trackerEntries.length +
        monthlyReflections.length +
        keepsakes.length +
        doodles.length +
        bookmarks.length +
        hiddenMemories.length,
      preservedConflicts: conflicts,
      skippedPreferences: Boolean(existingPreferences && source.preferences),
      missingMedia,
    };
  }
}

async function collisionMap<T extends { id: string }>(
  table: { get(id: string): Promise<unknown> },
  rows: T[],
) {
  const map = new Map<string, string>();
  for (const row of rows) if (await table.get(row.id)) map.set(row.id, newEntityId());
  return map;
}
function unsafePath(name: string) {
  return (
    name.startsWith("/") ||
    name.includes("\\") ||
    name.split("/").some((part) => part === ".." || part === "")
  );
}
function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  return btoa(binary);
}
function remapSource(type: string, id: string, maps: Record<string, Map<string, string>>) {
  const key =
    type === "photo"
      ? "media"
      : type === "journal"
        ? "journals"
        : type === "moment"
          ? "moments"
          : type === "day"
            ? "days"
            : type === "doodle"
              ? "doodles"
              : type === "monthly_reflection"
                ? "monthlyReflections"
                : "";
  return key ? (maps[key]?.get(id) ?? id) : id;
}
function operation(
  entityType: OutboxOperation["entityType"],
  record: { id?: string; userId: string; version: number },
) {
  const timestamp = nowIso();
  return OutboxOperationSchema.parse({
    operationId: newEntityId(),
    userId: record.userId,
    entityType,
    entityId: record.id ?? record.userId,
    action: "upsert",
    expectedVersion: record.version,
    payload: record,
    status: "pending",
    attempts: 0,
    createdAt: timestamp,
    nextAttemptAt: timestamp,
    lastError: null,
  });
}
