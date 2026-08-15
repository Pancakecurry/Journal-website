import type { JournalDatabase } from "@/infrastructure/local/database";
import { strToU8, Zip, ZipDeflate } from "fflate";

export const EXPORT_FORMAT_VERSION = "1.0.0";
const active = <T extends { deletedAt?: string | null }>(record: T) => !record.deletedAt;

export interface ExportProgress {
  stage: string;
  completed: number;
  total: number;
}
export interface ExportOptions {
  signal?: AbortSignal;
  onProgress?: (progress: ExportProgress) => void;
}

export class JournalExportService {
  constructor(private readonly database: JournalDatabase) {}

  async structured(userId: string) {
    const [
      days,
      moments,
      journalEntries,
      reflections,
      media,
      preferences,
      trackerDefinitions,
      trackerEntries,
      monthlyReflections,
      keepsakes,
      doodles,
      bookmarks,
      hiddenMemories,
    ] = await Promise.all([
      this.database.days.where("userId").equals(userId).filter(active).toArray(),
      this.database.moments.where("userId").equals(userId).filter(active).toArray(),
      this.database.journalEntries.where("userId").equals(userId).filter(active).toArray(),
      this.database.reflections.where("userId").equals(userId).filter(active).toArray(),
      this.database.media.where("userId").equals(userId).filter(active).toArray(),
      this.database.preferences.get(userId),
      this.database.trackerDefinitions.where("userId").equals(userId).filter(active).toArray(),
      this.database.trackerEntries.where("userId").equals(userId).filter(active).toArray(),
      this.database.monthlyReflections.where("userId").equals(userId).filter(active).toArray(),
      this.database.keepsakes.where("userId").equals(userId).filter(active).toArray(),
      this.database.doodles.where("userId").equals(userId).filter(active).toArray(),
      this.database.bookmarks.where("userId").equals(userId).filter(active).toArray(),
      this.database.hiddenMemories.where("userId").equals(userId).filter(active).toArray(),
    ]);
    return {
      manifest: {
        product: "Campus Atelier Journal",
        format: "campus-atelier-journal-export",
        formatVersion: EXPORT_FORMAT_VERSION,
        exportedAt: new Date().toISOString(),
        content: "canonical-user-data",
        derivedAiDataIncluded: false,
        assistantConversationsIncluded: false,
      },
      data: {
        days,
        moments,
        journalEntries,
        reflections,
        media: media.map((item) => withoutField(item, "blob")),
        preferences: preferences ?? null,
        trackerDefinitions,
        trackerEntries,
        monthlyReflections,
        keepsakes,
        doodles: doodles.map((item) => withoutField(item, "previewDataUrl")),
        bookmarks,
        hiddenMemories,
      },
    };
  }

  async markdown(userId: string): Promise<string> {
    const archive = await this.structured(userId);
    return markdownFromArchive(archive);
  }

  async completeArchive(userId: string, options: ExportOptions = {}): Promise<Blob> {
    abortIfNeeded(options.signal);
    options.onProgress?.({ stage: "Reading your journal", completed: 0, total: 4 });
    const [structured, media, doodles] = await Promise.all([
      this.structured(userId),
      this.database.media.where("userId").equals(userId).filter(active).toArray(),
      this.database.doodles.where("userId").equals(userId).filter(active).toArray(),
    ]);
    const markdown = markdownFromArchive(structured);
    abortIfNeeded(options.signal);
    options.onProgress?.({ stage: "Packing words", completed: 1, total: 4 });
    const files: Record<string, Uint8Array> = {
      "manifest.json": strToU8(JSON.stringify(structured.manifest, null, 2)),
      "data/journal.json": strToU8(JSON.stringify(structured, null, 2)),
      "journal.md": strToU8(markdown),
      "README.txt": strToU8(
        "Campus Atelier Journal export\n\nOpen journal.md for a readable copy. data/journal.json contains the versioned structured archive. media/ contains locally available private images. This archive was created on your device and was not uploaded to generate it.\n",
      ),
    };
    let processed = 0;
    const totalAssets = media.length + doodles.filter((item) => item.previewDataUrl).length;
    for (const item of media) {
      abortIfNeeded(options.signal);
      if (item.blob)
        files[`media/${safeName(item.id)}.${extensionFor(item.mimeType)}`] = new Uint8Array(
          await item.blob.arrayBuffer(),
        );
      processed += 1;
      options.onProgress?.({
        stage: "Gathering private media",
        completed: processed,
        total: Math.max(totalAssets, 1),
      });
    }
    for (const item of doodles) {
      abortIfNeeded(options.signal);
      const decoded = dataUrlBytes(item.previewDataUrl);
      if (decoded) files[`media/doodles/${safeName(item.id)}.png`] = decoded;
      processed += 1;
      options.onProgress?.({
        stage: "Gathering doodles",
        completed: processed,
        total: Math.max(totalAssets, 1),
      });
    }
    options.onProgress?.({ stage: "Closing the archive", completed: 3, total: 4 });
    const bytes = await streamZip(files);
    abortIfNeeded(options.signal);
    options.onProgress?.({ stage: "Ready", completed: 4, total: 4 });
    return new Blob([bytes as BlobPart], { type: "application/zip" });
  }

  async deleteLocalUserData(userId: string): Promise<void> {
    const tables = [
      this.database.days,
      this.database.moments,
      this.database.journalEntries,
      this.database.media,
      this.database.reflections,
      this.database.preferences,
      this.database.outbox,
      this.database.syncMeta,
      this.database.daySummaries,
      this.database.journalSummaries,
      this.database.searchDocuments,
      this.database.searchTerms,
      this.database.bookmarks,
      this.database.trackerDefinitions,
      this.database.trackerEntries,
      this.database.monthlyReflections,
      this.database.keepsakes,
      this.database.doodles,
      this.database.hiddenMemories,
      this.database.semanticChunks,
      this.database.semanticIndexState,
    ];
    await this.database.transaction("rw", tables, async () => {
      for (const table of tables) {
        if (table === this.database.outbox) await table.clear();
        else if (table.schema.idxByName.userId) await table.where("userId").equals(userId).delete();
        else if (table === this.database.syncMeta || table === this.database.semanticIndexState)
          await table.delete(userId);
      }
    });
  }
}

type StructuredArchive = Awaited<ReturnType<JournalExportService["structured"]>>;

function markdownFromArchive(archive: StructuredArchive): string {
  const sections = archive.data.days
    .sort((a, b) => a.localDate.localeCompare(b.localDate))
    .map((day) => {
      const lines = [`# ${day.localDate}`, ""];
      for (const moment of archive.data.moments.filter((item) => item.dayId === day.id)) {
        if (moment.content.kind === "text") lines.push(`- ${moment.content.text}`);
        if (moment.content.kind === "mood") lines.push(`- Mood: ${moment.content.mood}`);
      }
      for (const entry of archive.data.journalEntries.filter((item) => item.dayId === day.id))
        lines.push("", `## ${entry.title || "Journal"}`, "", entry.body);
      for (const reflection of archive.data.reflections.filter((item) => item.dayId === day.id)) {
        lines.push(
          "",
          `## ${reflection.period === "morning" ? "Morning check-in" : "Evening wrap-up"}`,
          "",
        );
        for (const answer of reflection.answers.filter((item) => !item.skipped && item.answer))
          lines.push(`- ${answer.answer}`);
      }
      for (const photo of archive.data.media.filter(
        (item) => item.dayId === day.id && item.caption,
      ))
        lines.push(`- Photo: ${photo.caption}`);
      return lines.join("\n").trim();
    });
  const orphaned = archive.data.monthlyReflections.map(
    (item) => `# Monthly reflection · ${item.month}\n\n${item.body}`,
  );
  return [
    `# My Campus Atelier Journal`,
    ``,
    `Exported ${archive.manifest.exportedAt}.`,
    ``,
    ...sections,
    ...orphaned,
    ``,
  ].join("\n\n");
}

function abortIfNeeded(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException("Export cancelled", "AbortError");
}
function safeName(value: string) {
  return value.replace(/[^a-z0-9_-]/gi, "_");
}
function extensionFor(mime: string) {
  return (
    (
      {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
      } as Record<string, string>
    )[mime] ?? "bin"
  );
}
function dataUrlBytes(value: string): Uint8Array | null {
  const match = value.match(/^data:[^;]+;base64,(.+)$/);
  if (!match) return null;
  const binary = atob(match[1]!);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
function streamZip(files: Record<string, Uint8Array>): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    let length = 0;
    const archive = new Zip((error, chunk, final) => {
      if (error) {
        reject(error);
        return;
      }
      chunks.push(chunk);
      length += chunk.length;
      if (final) {
        const output = new Uint8Array(length);
        let offset = 0;
        for (const item of chunks) {
          output.set(item, offset);
          offset += item.length;
        }
        resolve(output);
      }
    });
    for (const [name, data] of Object.entries(files)) {
      const entry = new ZipDeflate(name, { level: 6 });
      archive.add(entry);
      entry.push(data, true);
    }
    archive.end();
  });
}
function withoutField<T extends object, K extends keyof T>(value: T, field: K): Omit<T, K> {
  const copy = { ...value };
  Reflect.deleteProperty(copy, field);
  return copy;
}
