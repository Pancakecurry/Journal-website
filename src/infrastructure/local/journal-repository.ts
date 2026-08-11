import type { Day } from "@/domain/day";
import { createDay } from "@/domain/day";
import type { Moment } from "@/domain/moment";
import { createMoment, createTextMoment, type MomentContent } from "@/domain/moment";
import { createJournalEntry, type JournalEntry } from "@/domain/journal-entry";
import { createLocalMedia, type LocalMedia } from "@/domain/media";
import { createReflection, type Reflection, type ReflectionPeriod } from "@/domain/reflection";
import { newEntityId, nowIso, type LocalDate } from "@/domain/shared";
import type { OutboxOperation } from "@/domain/sync";
import { OutboxOperationSchema } from "@/domain/sync";
import type { JournalDatabase } from "@/infrastructure/local/database";

export interface DayWithMoments {
  day: Day | null;
  moments: Moment[];
  journals: JournalEntry[];
  media: LocalMedia[];
  reflections: Reflection[];
}

export class LocalJournalRepository {
  constructor(private readonly database: JournalDatabase) {}

  async getDay(userId: string, localDate: LocalDate): Promise<DayWithMoments> {
    const day = await this.database.days
      .where("[userId+localDate]")
      .equals([userId, localDate])
      .first();
    if (!day) return { day: null, moments: [], journals: [], media: [], reflections: [] };
    const [moments, journals, media, reflections] = await Promise.all([
      this.database.moments
        .where("[userId+dayId]")
        .equals([userId, day.id])
        .filter(active)
        .sortBy("occurredAt"),
      this.database.journalEntries
        .where("[userId+dayId]")
        .equals([userId, day.id])
        .filter(active)
        .sortBy("updatedAt"),
      this.database.media
        .where("[userId+dayId]")
        .equals([userId, day.id])
        .filter(active)
        .sortBy("createdAt"),
      this.database.reflections
        .where("[userId+dayId]")
        .equals([userId, day.id])
        .filter(active)
        .sortBy("updatedAt"),
    ]);
    return { day, moments, journals, media, reflections };
  }

  async addMoment(input: {
    userId: string;
    localDate: LocalDate;
    timeZone: string;
    content: MomentContent;
  }): Promise<{ day: Day; moment: Moment }> {
    return this.database.transaction(
      "rw",
      [this.database.days, this.database.moments, this.database.outbox],
      async () => {
        const day = await this.ensureDay(input);
        const moment = createMoment({
          userId: input.userId,
          dayId: day.id,
          content: input.content,
        });
        await this.database.moments.add(moment);
        await this.database.outbox.add(this.operationFor("moment", moment.id, moment));
        return { day, moment };
      },
    );
  }

  async setMood(input: {
    userId: string;
    localDate: LocalDate;
    timeZone: string;
    mood: "bright" | "good" | "okay" | "off" | "rough";
  }): Promise<Moment> {
    return this.database.transaction(
      "rw",
      [this.database.days, this.database.moments, this.database.outbox],
      async () => {
        const day = await this.ensureDay(input);
        const existing = await this.database.moments
          .where("[userId+dayId]")
          .equals([input.userId, day.id])
          .filter((item) => item.deletedAt === null && item.content.kind === "mood")
          .first();
        if (existing) {
          const updated = {
            ...existing,
            content: { kind: "mood" as const, mood: input.mood },
            updatedAt: nowIso(),
            version: existing.version + 1,
            syncState: "pending" as const,
          };
          await this.database.moments.put(updated);
          await this.database.outbox.add(this.operationFor("moment", updated.id, updated));
          return updated;
        }
        const created = createMoment({
          userId: input.userId,
          dayId: day.id,
          content: { kind: "mood", mood: input.mood },
        });
        await this.database.moments.add(created);
        await this.database.outbox.add(this.operationFor("moment", created.id, created));
        return created;
      },
    );
  }

  async addPhoto(input: {
    userId: string;
    localDate: LocalDate;
    timeZone: string;
    blob: Blob;
    mimeType: string;
    width: number;
    height: number;
    caption: string;
  }): Promise<{ media: LocalMedia; moment: Moment }> {
    return this.database.transaction(
      "rw",
      [this.database.days, this.database.moments, this.database.media, this.database.outbox],
      async () => {
        const day = await this.ensureDay(input);
        let media = createLocalMedia({ ...input, dayId: day.id });
        const moment = createMoment({
          userId: input.userId,
          dayId: day.id,
          content: { kind: "photo", mediaId: media.id },
        });
        media = { ...media, momentId: moment.id };
        await this.database.media.add(media);
        await this.database.moments.add(moment);
        await this.database.outbox.bulkAdd([
          this.operationFor("media", media.id, { ...media, blob: undefined }),
          this.operationFor("moment", moment.id, moment),
        ]);
        return { media, moment };
      },
    );
  }

  async createJournal(input: {
    userId: string;
    localDate: LocalDate;
    timeZone: string;
  }): Promise<JournalEntry> {
    return this.database.transaction(
      "rw",
      [
        this.database.days,
        this.database.moments,
        this.database.journalEntries,
        this.database.outbox,
      ],
      async () => {
        const day = await this.ensureDay(input);
        const journal = createJournalEntry({ userId: input.userId, dayId: day.id });
        const moment = createMoment({
          userId: input.userId,
          dayId: day.id,
          content: { kind: "journal", journalEntryId: journal.id },
        });
        await this.database.journalEntries.add(journal);
        await this.database.moments.add(moment);
        await this.database.outbox.bulkAdd([
          this.operationFor("journal_entry", journal.id, journal),
          this.operationFor("moment", moment.id, moment),
        ]);
        return journal;
      },
    );
  }

  async getJournal(id: string): Promise<JournalEntry | undefined> {
    const entry = await this.database.journalEntries.get(id);
    return entry?.deletedAt ? undefined : entry;
  }

  async getDayById(id: string): Promise<Day | undefined> {
    const day = await this.database.days.get(id);
    return day?.deletedAt ? undefined : day;
  }

  async listJournals(userId: string): Promise<Array<{ entry: JournalEntry; day: Day }>> {
    const entries = await this.database.journalEntries
      .where("userId")
      .equals(userId)
      .filter(active)
      .reverse()
      .sortBy("updatedAt");
    const days = await this.database.days.bulkGet(entries.map((entry) => entry.dayId));
    return entries.flatMap((entry, index) => (days[index] ? [{ entry, day: days[index]! }] : []));
  }

  async saveJournal(id: string, title: string, body: string): Promise<JournalEntry> {
    return this.database.transaction(
      "rw",
      [this.database.journalEntries, this.database.outbox],
      async () => {
        const current = await this.database.journalEntries.get(id);
        if (!current || current.deletedAt) throw new Error("Journal entry not found");
        const updated: JournalEntry = {
          ...current,
          title: title.trim() || null,
          body,
          updatedAt: nowIso(),
          version: current.version + 1,
          syncState: "pending",
        };
        await this.database.journalEntries.put(updated);
        await this.database.outbox.add(this.operationFor("journal_entry", id, updated));
        return updated;
      },
    );
  }

  async saveReflection(input: {
    userId: string;
    localDate: LocalDate;
    timeZone: string;
    period: ReflectionPeriod;
    answers: Reflection["answers"];
    currentQuestion: number;
    complete: boolean;
  }): Promise<Reflection> {
    return this.database.transaction(
      "rw",
      [this.database.days, this.database.reflections, this.database.outbox],
      async () => {
        const day = await this.ensureDay(input);
        const existing = await this.database.reflections
          .where("[userId+dayId+period]")
          .equals([input.userId, day.id, input.period])
          .first();
        const timestamp = nowIso();
        const record: Reflection = existing
          ? {
              ...existing,
              answers: input.answers,
              currentQuestion: input.currentQuestion,
              completedAt: input.complete ? (existing.completedAt ?? timestamp) : null,
              updatedAt: timestamp,
              version: existing.version + 1,
              syncState: "pending",
            }
          : {
              ...createReflection({ userId: input.userId, dayId: day.id, period: input.period }),
              answers: input.answers,
              currentQuestion: input.currentQuestion,
              completedAt: input.complete ? timestamp : null,
            };
        await this.database.reflections.put(record);
        await this.database.outbox.add(this.operationFor("reflection", record.id, record));
        return record;
      },
    );
  }

  async deleteEntity(
    type: "moment" | "journal_entry" | "media" | "reflection",
    id: string,
  ): Promise<void> {
    const table =
      type === "moment"
        ? this.database.moments
        : type === "journal_entry"
          ? this.database.journalEntries
          : type === "media"
            ? this.database.media
            : this.database.reflections;
    await this.database.transaction("rw", [table, this.database.outbox], async () => {
      const current = (await table.get(id)) as
        | {
            id: string;
            userId: string;
            version: number;
            updatedAt: string;
            deletedAt: string | null;
            syncState: string;
          }
        | undefined;
      if (!current) return;
      const timestamp = nowIso();
      await table.update(id, {
        deletedAt: timestamp,
        updatedAt: timestamp,
        version: current.version + 1,
        syncState: "pending",
      });
      await this.database.outbox.add(this.deleteOperationFor(type, current));
    });
  }

  async updateTextMoment(id: string, text: string): Promise<Moment> {
    return this.database.transaction(
      "rw",
      [this.database.moments, this.database.outbox],
      async () => {
        const current = await this.database.moments.get(id);
        if (!current || current.deletedAt || current.content.kind !== "text")
          throw new Error("Moment not found");
        const updated: Moment = {
          ...current,
          content: { kind: "text", text: text.trim() },
          updatedAt: nowIso(),
          version: current.version + 1,
          syncState: "pending",
        };
        await this.database.moments.put(updated);
        await this.database.outbox.add(this.operationFor("moment", id, updated));
        return updated;
      },
    );
  }

  async deleteJournal(id: string): Promise<void> {
    const entry = await this.database.journalEntries.get(id);
    if (!entry) return;
    const linked = await this.database.moments
      .where("[userId+dayId]")
      .equals([entry.userId, entry.dayId])
      .filter((moment) => moment.content.kind === "journal" && moment.content.journalEntryId === id)
      .first();
    await this.deleteEntity("journal_entry", id);
    if (linked) await this.deleteEntity("moment", linked.id);
  }

  async deletePhotoMoment(momentId: string, mediaId: string): Promise<void> {
    await this.deleteEntity("moment", momentId);
    await this.deleteEntity("media", mediaId);
  }

  async listDays(userId: string): Promise<Day[]> {
    return this.database.days
      .where("userId")
      .equals(userId)
      .filter(active)
      .reverse()
      .sortBy("localDate");
  }

  private async ensureDay(input: {
    userId: string;
    localDate: LocalDate;
    timeZone: string;
  }): Promise<Day> {
    let day = await this.database.days
      .where("[userId+localDate]")
      .equals([input.userId, input.localDate])
      .first();
    if (!day) {
      day = createDay(input);
      await this.database.days.add(day);
      await this.database.outbox.add(this.operationFor("day", day.id, day));
    }
    return day;
  }

  private deleteOperationFor(
    entityType: OutboxOperation["entityType"],
    record: { id: string; userId: string; version: number },
  ): OutboxOperation {
    const operation = this.operationFor(entityType, record.id, {
      ...record,
      version: record.version + 1,
    });
    return { ...operation, action: "delete", expectedVersion: record.version };
  }

  async addTextMoment(input: {
    userId: string;
    localDate: LocalDate;
    timeZone: string;
    text: string;
  }): Promise<{ day: Day; moment: Moment }> {
    return this.database.transaction(
      "rw",
      [this.database.days, this.database.moments, this.database.outbox],
      async () => {
        let day = await this.database.days
          .where("[userId+localDate]")
          .equals([input.userId, input.localDate])
          .first();

        if (!day) {
          day = createDay(input);
          await this.database.days.add(day);
          await this.database.outbox.add(this.operationFor("day", day.id, day));
        }

        const moment = createTextMoment({ userId: input.userId, dayId: day.id, text: input.text });
        await this.database.moments.add(moment);
        await this.database.outbox.add(this.operationFor("moment", moment.id, moment));
        return { day, moment };
      },
    );
  }

  private operationFor(
    entityType: OutboxOperation["entityType"],
    entityId: string,
    payload: unknown,
  ): OutboxOperation {
    const timestamp = nowIso();
    return OutboxOperationSchema.parse({
      operationId: newEntityId(),
      userId: (payload as { userId: string }).userId,
      entityType,
      entityId,
      action: "upsert",
      expectedVersion: (payload as { version: number }).version,
      payload,
      status: "pending",
      attempts: 0,
      createdAt: timestamp,
      nextAttemptAt: timestamp,
      lastError: null,
    });
  }
}

const active = (record: { deletedAt: string | null }) => record.deletedAt === null;
