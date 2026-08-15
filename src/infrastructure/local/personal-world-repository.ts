import { createDay } from "@/domain/day";
import { createMoment } from "@/domain/moment";
import {
  DoodleSchema,
  HiddenMemorySchema,
  KeepsakeSchema,
  type Doodle,
  type DoodleStroke,
  type Keepsake,
  type KeepsakeSource,
  type ResurfacedMemory,
  type WorldSummary,
} from "@/domain/personal-world";
import { UserPreferencesSchema, type UserPreferences } from "@/domain/preferences";
import { newEntityId, nowIso, type LocalDate } from "@/domain/shared";
import type { OutboxOperation } from "@/domain/sync";
import { OutboxOperationSchema } from "@/domain/sync";
import type { JournalDatabase } from "./database";
import { refreshDayDerived } from "./derived-indexes";

const active = (record: { deletedAt: string | null }) => record.deletedAt === null;

export const DEFAULT_PREFERENCES = {
  accent: "powder",
  paper: "clean",
  notebookCover: "canvas",
  environmentDensity: "standard",
  reflectionEnabled: true,
  reducedMotionOverride: "system",
  memoryResurfacingEnabled: true,
  memoryRangeYears: 5,
} as const;

export class LocalPersonalWorldRepository {
  constructor(private readonly database: JournalDatabase) {}

  async preferences(userId: string): Promise<UserPreferences> {
    const stored = await this.database.preferences.get(userId);
    if (stored) return UserPreferencesSchema.parse(stored);
    const timestamp = nowIso();
    return UserPreferencesSchema.parse({
      userId,
      ...DEFAULT_PREFERENCES,
      createdAt: timestamp,
      updatedAt: timestamp,
      version: 0,
      syncState: "local",
    });
  }

  async savePreferences(
    userId: string,
    changes: Partial<
      Pick<
        UserPreferences,
        | "accent"
        | "paper"
        | "notebookCover"
        | "environmentDensity"
        | "reflectionEnabled"
        | "reducedMotionOverride"
        | "memoryResurfacingEnabled"
        | "memoryRangeYears"
      >
    >,
  ): Promise<UserPreferences> {
    const current = await this.preferences(userId);
    const record = UserPreferencesSchema.parse({
      ...current,
      ...changes,
      updatedAt: nowIso(),
      version: current.version + 1,
      syncState: "pending",
    });
    await this.database.transaction(
      "rw",
      [this.database.preferences, this.database.outbox],
      async () => {
        await this.database.preferences.put(record);
        await this.database.outbox.add(this.operation("preferences", userId, record));
      },
    );
    if (typeof window !== "undefined")
      window.dispatchEvent(new CustomEvent("campus-atelier:preferences", { detail: record }));
    return record;
  }

  async addKeepsake(input: {
    userId: string;
    sourceType: KeepsakeSource;
    sourceId: string;
    dayId?: string | null;
    localDate?: LocalDate | null;
    month?: string | null;
    title: string;
    preview?: string;
  }): Promise<Keepsake> {
    const existing = await this.database.keepsakes
      .where("[userId+sourceId]")
      .equals([input.userId, input.sourceId])
      .filter((item) => item.sourceType === input.sourceType && item.deletedAt === null)
      .first();
    if (existing) return existing;
    const timestamp = nowIso();
    const record = KeepsakeSchema.parse({
      id: newEntityId(),
      userId: input.userId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      dayId: input.dayId ?? null,
      localDate: input.localDate ?? null,
      month: input.month ?? null,
      title: input.title,
      preview: input.preview ?? "",
      createdAt: timestamp,
      updatedAt: timestamp,
      version: 0,
      syncState: "pending",
      deletedAt: null,
    });
    await this.database.transaction(
      "rw",
      [this.database.keepsakes, this.database.outbox],
      async () => {
        await this.database.keepsakes.add(record);
        await this.database.outbox.add(this.operation("keepsake", record.id, record));
      },
    );
    return record;
  }

  async removeKeepsake(id: string): Promise<void> {
    const current = await this.database.keepsakes.get(id);
    if (!current || current.deletedAt) return;
    const record = {
      ...current,
      deletedAt: nowIso(),
      updatedAt: nowIso(),
      version: current.version + 1,
      syncState: "pending" as const,
    };
    await this.database.transaction(
      "rw",
      [this.database.keepsakes, this.database.outbox],
      async () => {
        await this.database.keepsakes.put(record);
        await this.database.outbox.add({
          ...this.operation("keepsake", record.id, record),
          action: "delete",
        });
      },
    );
  }

  async keepsakes(userId: string, limit = 100): Promise<Keepsake[]> {
    const records = await this.database.keepsakes
      .where("[userId+createdAt]")
      .between([userId, ""], [userId, "\uffff"])
      .reverse()
      .limit(Math.min(limit, 200))
      .filter(active)
      .toArray();
    const validity = await Promise.all(records.map((item) => this.sourceExists(item)));
    const dangling = records.filter((_, index) => !validity[index]);
    await Promise.all(dangling.map((item) => this.removeKeepsake(item.id)));
    return records.filter((_, index) => validity[index]);
  }

  async saveDoodle(input: {
    id?: string;
    userId: string;
    localDate: LocalDate;
    timeZone: string;
    title: string;
    description: string;
    width: number;
    height: number;
    strokes: DoodleStroke[];
    previewDataUrl: string;
  }): Promise<Doodle> {
    const current = input.id ? await this.database.doodles.get(input.id) : undefined;
    if (current && (current.userId !== input.userId || current.deletedAt))
      throw new Error("Doodle not available");
    const timestamp = nowIso();
    let day = await this.database.days
      .where("[userId+localDate]")
      .equals([input.userId, input.localDate])
      .first();
    const isNewDay = !day;
    day ??= createDay(input);
    const record = DoodleSchema.parse({
      id: current?.id ?? newEntityId(),
      userId: input.userId,
      dayId: day.id,
      localDate: input.localDate,
      title: input.title.trim(),
      description: input.description.trim(),
      width: input.width,
      height: input.height,
      strokes: input.strokes,
      previewDataUrl: input.previewDataUrl,
      createdAt: current?.createdAt ?? timestamp,
      updatedAt: timestamp,
      version: current ? current.version + 1 : 0,
      syncState: "pending",
      deletedAt: null,
    });
    await this.database.transaction(
      "rw",
      [this.database.days, this.database.moments, this.database.doodles, this.database.outbox],
      async () => {
        if (isNewDay) {
          await this.database.days.add(day!);
          await this.database.outbox.add(this.operation("day", day!.id, day!));
        }
        await this.database.doodles.put(record);
        await this.database.outbox.add(this.operation("doodle", record.id, record));
        if (!current) {
          const moment = createMoment({
            userId: input.userId,
            dayId: day!.id,
            content: { kind: "doodle", doodleId: record.id },
          });
          await this.database.moments.add(moment);
          await this.database.outbox.add(this.operation("moment", moment.id, moment));
        }
      },
    );
    await refreshDayDerived(this.database, input.userId, day.id);
    return record;
  }

  async doodle(id: string): Promise<Doodle | undefined> {
    const item = await this.database.doodles.get(id);
    return item?.deletedAt ? undefined : item;
  }

  async doodles(userId: string, limit = 40): Promise<Doodle[]> {
    return this.database.doodles
      .where("[userId+updatedAt]")
      .between([userId, ""], [userId, "\uffff"])
      .reverse()
      .limit(Math.min(limit, 100))
      .filter(active)
      .toArray();
  }

  async deleteDoodle(id: string): Promise<void> {
    const current = await this.database.doodles.get(id);
    if (!current || current.deletedAt) return;
    const timestamp = nowIso();
    const record = {
      ...current,
      deletedAt: timestamp,
      updatedAt: timestamp,
      version: current.version + 1,
      syncState: "pending" as const,
    };
    const linked = await this.database.moments
      .where("[userId+dayId]")
      .equals([current.userId, current.dayId])
      .filter(
        (item) => item.content.kind === "doodle" && item.content.doodleId === id && !item.deletedAt,
      )
      .first();
    await this.database.transaction(
      "rw",
      [this.database.doodles, this.database.moments, this.database.keepsakes, this.database.outbox],
      async () => {
        await this.database.doodles.put(record);
        await this.database.outbox.add({
          ...this.operation("doodle", id, record),
          action: "delete",
        });
        if (linked) {
          const tombstone = {
            ...linked,
            deletedAt: timestamp,
            updatedAt: timestamp,
            version: linked.version + 1,
            syncState: "pending" as const,
          };
          await this.database.moments.put(tombstone);
          await this.database.outbox.add({
            ...this.operation("moment", linked.id, tombstone),
            action: "delete",
          });
        }
        const keepsakes = await this.database.keepsakes
          .where("[userId+sourceId]")
          .equals([current.userId, id])
          .filter(active)
          .toArray();
        for (const keepsake of keepsakes) {
          const removed = {
            ...keepsake,
            deletedAt: timestamp,
            updatedAt: timestamp,
            version: keepsake.version + 1,
            syncState: "pending" as const,
          };
          await this.database.keepsakes.put(removed);
          await this.database.outbox.add({
            ...this.operation("keepsake", keepsake.id, removed),
            action: "delete",
          });
        }
      },
    );
    await refreshDayDerived(this.database, current.userId, current.dayId);
  }

  async summary(userId: string): Promise<WorldSummary> {
    const [dayCount, photoCount, keepsakeCount, doodleCount, trackerCount, completedMonthCount] =
      await Promise.all([
        this.database.days.where("userId").equals(userId).filter(active).count(),
        this.database.media.where("userId").equals(userId).filter(active).count(),
        this.database.keepsakes.where("userId").equals(userId).filter(active).count(),
        this.database.doodles.where("userId").equals(userId).filter(active).count(),
        this.database.trackerDefinitions
          .where("userId")
          .equals(userId)
          .filter((item) => active(item) && !item.archivedAt)
          .count(),
        this.database.monthlyReflections
          .where("userId")
          .equals(userId)
          .filter((item) => active(item) && Boolean(item.body.trim()))
          .count(),
      ]);
    return { dayCount, photoCount, keepsakeCount, doodleCount, trackerCount, completedMonthCount };
  }

  async memoryForDay(userId: string, today: LocalDate): Promise<ResurfacedMemory | null> {
    const preferences = await this.preferences(userId);
    if (!preferences.memoryResurfacingEnabled) return null;
    const [year, monthDay] = [Number(today.slice(0, 4)), today.slice(5)];
    for (let offset = 1; offset <= preferences.memoryRangeYears; offset += 1) {
      const localDate = `${year - offset}-${monthDay}` as LocalDate;
      const day = await this.database.days
        .where("[userId+localDate]")
        .equals([userId, localDate])
        .filter(active)
        .first();
      if (!day) continue;
      const hidden = await this.database.hiddenMemories
        .where("[userId+dayId]")
        .equals([userId, day.id])
        .filter(active)
        .toArray();
      if (hidden.some((item) => item.scope === "day")) continue;
      const hiddenIds = new Set(hidden.map((item) => item.entityId));
      const [moments, journals, doodles] = await Promise.all([
        this.database.moments
          .where("[userId+dayId]")
          .equals([userId, day.id])
          .filter(active)
          .sortBy("occurredAt"),
        this.database.journalEntries
          .where("[userId+dayId]")
          .equals([userId, day.id])
          .filter(active)
          .limit(1)
          .toArray(),
        this.database.doodles
          .where("[userId+localDate]")
          .equals([userId, localDate])
          .filter(active)
          .limit(1)
          .toArray(),
      ]);
      const textCandidate = moments.find(
        (item) => item.content.kind === "text" && !hiddenIds.has(item.id),
      );
      if (textCandidate?.content.kind === "text")
        return {
          entityType: "moment",
          entityId: textCandidate.id,
          dayId: day.id,
          localDate,
          title: "From this Day",
          preview: textCandidate.content.text,
        };
      const photoCandidate = moments.find(
        (item) => item.content.kind === "photo" && !hiddenIds.has(item.id),
      );
      if (photoCandidate?.content.kind === "photo") {
        const media = await this.database.media.get(photoCandidate.content.mediaId);
        if (media?.deletedAt === null)
          return {
            entityType: "photo",
            entityId: photoCandidate.id,
            dayId: day.id,
            localDate,
            title: "A photo from this Day",
            preview: media.caption || "A photo you tucked into this Day.",
            previewBlob: media.blob ?? undefined,
          } as ResurfacedMemory;
      }
      const journal = journals.find((item) => !hiddenIds.has(item.id));
      if (journal)
        return {
          entityType: "journal",
          entityId: journal.id,
          dayId: day.id,
          localDate,
          title: journal.title || "A journal page from this Day",
          preview: journal.body.slice(0, 260),
        };
      const doodle = doodles.find((item) => !hiddenIds.has(item.id));
      if (doodle)
        return {
          entityType: "doodle",
          entityId: doodle.id,
          dayId: day.id,
          localDate,
          title: doodle.title || "A doodle from this Day",
          preview: doodle.description,
          previewDataUrl: doodle.previewDataUrl,
        };
    }
    return null;
  }

  async hideMemory(userId: string, memory: ResurfacedMemory, scope: "item" | "day"): Promise<void> {
    const timestamp = nowIso();
    const record = HiddenMemorySchema.parse({
      id: newEntityId(),
      userId,
      scope,
      entityType: scope === "day" ? "day" : memory.entityType,
      entityId: scope === "day" ? memory.dayId : memory.entityId,
      dayId: memory.dayId,
      createdAt: timestamp,
      version: 0,
      syncState: "pending",
      deletedAt: null,
    });
    await this.database.transaction(
      "rw",
      [this.database.hiddenMemories, this.database.outbox],
      async () => {
        await this.database.hiddenMemories.add(record);
        await this.database.outbox.add(this.operation("hidden_memory", record.id, record));
      },
    );
  }

  private async sourceExists(item: Keepsake): Promise<boolean> {
    if (item.sourceType === "monthly_recap") return Boolean(item.month);
    if (item.sourceType === "monthly_reflection") {
      const row = await this.database.monthlyReflections.get(item.sourceId);
      return Boolean(row && !row.deletedAt);
    }
    if (item.sourceType === "day") {
      const row = await this.database.days.get(item.sourceId);
      return Boolean(row && !row.deletedAt);
    }
    if (item.sourceType === "journal") {
      const row = await this.database.journalEntries.get(item.sourceId);
      return Boolean(row && !row.deletedAt);
    }
    if (item.sourceType === "doodle") {
      const row = await this.database.doodles.get(item.sourceId);
      return Boolean(row && !row.deletedAt);
    }
    if (item.sourceType === "photo") {
      const row = await this.database.media.get(item.sourceId);
      return Boolean(row && !row.deletedAt);
    }
    const row = await this.database.moments.get(item.sourceId);
    return Boolean(row && !row.deletedAt);
  }

  private operation(
    entityType: OutboxOperation["entityType"],
    entityId: string,
    payload: { userId: string; version: number },
  ): OutboxOperation {
    const timestamp = nowIso();
    return OutboxOperationSchema.parse({
      operationId: newEntityId(),
      userId: payload.userId,
      entityType,
      entityId,
      action: "upsert",
      expectedVersion: payload.version,
      payload,
      status: "pending",
      attempts: 0,
      createdAt: timestamp,
      nextAttemptAt: timestamp,
      lastError: null,
    });
  }
}
