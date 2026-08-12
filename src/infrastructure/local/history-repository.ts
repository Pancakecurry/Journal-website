import type {
  Bookmark,
  DaySummary,
  JournalSummary,
  MonthlyReflection,
  SearchDocument,
  TrackerDefinition,
  TrackerEntry,
  TrackerType,
  TrackerValue,
} from "@/domain/history";
import { normalizeSearchText, searchTokens } from "@/domain/history";
import { createDay } from "@/domain/day";
import { newEntityId, nowIso, type LocalDate } from "@/domain/shared";
import type { OutboxOperation } from "@/domain/sync";
import { OutboxOperationSchema } from "@/domain/sync";
import type { JournalDatabase } from "./database";
import { refreshDayDerived } from "./derived-indexes";

const active = (record: { deletedAt: string | null }) => record.deletedAt === null;

export class LocalHistoryRepository {
  constructor(private readonly database: JournalDatabase) {}

  async month(userId: string, month: string): Promise<DaySummary[]> {
    const start = `${month}-01` as LocalDate;
    const endDate = new Date(`${start}T12:00:00Z`);
    endDate.setUTCMonth(endDate.getUTCMonth() + 1);
    const end = endDate.toISOString().slice(0, 10) as LocalDate;
    const days = await this.database.days
      .where("[userId+localDate]")
      .between([userId, start], [userId, end], true, false)
      .filter(active)
      .toArray();
    const summaries = await this.database.daySummaries.bulkGet(days.map((day) => day.id));
    for (let index = 0; index < days.length; index += 1) {
      if (!summaries[index] || summaries[index]!.updatedAt < days[index]!.updatedAt)
        await refreshDayDerived(this.database, userId, days[index]!.id);
    }
    return this.database.daySummaries
      .where("[userId+localDate]")
      .between([userId, start], [userId, end], true, false)
      .toArray();
  }

  async daySummary(userId: string, localDate: LocalDate): Promise<DaySummary | undefined> {
    const day = await this.database.days
      .where("[userId+localDate]")
      .equals([userId, localDate])
      .first();
    if (!day) return undefined;
    await refreshDayDerived(this.database, userId, day.id);
    return this.database.daySummaries.get(day.id);
  }

  async journals(
    userId: string,
    options: { cursor?: string; limit?: number; bookmarked?: boolean } = {},
  ): Promise<JournalSummary[]> {
    await this.seedMissingJournalSummaries(userId);
    const limit = Math.min(options.limit ?? 20, 50);
    let collection = this.database.journalSummaries
      .where("[userId+updatedAt]")
      .between([userId, ""], [userId, options.cursor ?? "\uffff"]);
    const page = await collection
      .reverse()
      .limit(limit + 1)
      .toArray();
    return (options.bookmarked ? page.filter((item) => item.bookmarked) : page).slice(0, limit);
  }

  async toggleBookmark(userId: string, journalEntryId: string): Promise<boolean> {
    const current = await this.database.bookmarks
      .where("[userId+journalEntryId]")
      .equals([userId, journalEntryId])
      .filter(active)
      .first();
    const timestamp = nowIso();
    let bookmarked: boolean;
    if (current) {
      await this.database.bookmarks.update(current.id, {
        deletedAt: timestamp,
        syncState: "pending",
        version: current.version + 1,
      });
      const tombstone: Bookmark = {
        ...current,
        deletedAt: timestamp,
        version: current.version + 1,
      };
      await this.database.outbox.add(this.operation("bookmark", current.id, tombstone));
      bookmarked = false;
    } else {
      const bookmark: Bookmark = {
        id: newEntityId(),
        userId,
        journalEntryId,
        createdAt: timestamp,
        version: 0,
        syncState: "pending",
        deletedAt: null,
      };
      await this.database.bookmarks.add(bookmark);
      await this.database.outbox.add(this.operation("bookmark", bookmark.id, bookmark));
      bookmarked = true;
    }
    await this.database.journalSummaries.update(journalEntryId, { bookmarked });
    return bookmarked;
  }

  async search(userId: string, query: string, limit = 40): Promise<SearchDocument[]> {
    const normalized = normalizeSearchText(query);
    const tokens = searchTokens(normalized);
    if (!normalized || !tokens.length) return [];
    if (
      (await this.database.searchDocuments.where("userId").equals(userId).limit(1).count()) === 0
    ) {
      const days = await this.database.days.where("userId").equals(userId).filter(active).toArray();
      for (const day of days) await refreshDayDerived(this.database, userId, day.id);
    }
    const termRows = await this.database.searchTerms
      .where("[userId+token]")
      .equals([userId, tokens[0]!])
      .limit(300)
      .toArray();
    const candidates = termRows.length
      ? await this.database.searchDocuments.bulkGet(termRows.map((row) => row.documentId))
      : await this.database.searchDocuments.where("userId").equals(userId).limit(300).toArray();
    const matched = candidates
      .filter((item): item is SearchDocument => Boolean(item && item.userId === userId))
      .filter((item) =>
        tokens.every((token) =>
          `${item.title} ${item.normalizedText} ${item.localDate}`
            .toLocaleLowerCase()
            .includes(token),
        ),
      )
      .sort((left, right) => right.localDate.localeCompare(left.localDate))
      .slice(0, Math.min(limit, 100));
    if (matched.length) return matched;

    // A bounded canonical fallback covers the brief window before a legacy/local index rebuild.
    const [moments, journals] = await Promise.all([
      this.database.moments.where("userId").equals(userId).filter(active).limit(300).toArray(),
      this.database.journalEntries
        .where("userId")
        .equals(userId)
        .filter(active)
        .limit(100)
        .toArray(),
    ]);
    const rows = [
      ...moments.flatMap((moment) =>
        moment.content.kind === "text"
          ? [
              {
                entityId: moment.id,
                dayId: moment.dayId,
                kind: "moment" as const,
                title: "Moment",
                text: moment.content.text,
                updatedAt: moment.updatedAt,
              },
            ]
          : [],
      ),
      ...journals.map((entry) => ({
        entityId: entry.id,
        dayId: entry.dayId,
        kind: "journal" as const,
        title: entry.title || "Untitled journal page",
        text: `${entry.title ?? ""} ${entry.body}`,
        updatedAt: entry.updatedAt,
      })),
    ].filter((item) =>
      tokens.every((token) => normalizeSearchText(`${item.title} ${item.text}`).includes(token)),
    );
    const days = await this.database.days.bulkGet(rows.map((item) => item.dayId));
    return rows
      .flatMap((item, index) => {
        const day = days[index];
        return day && day.userId === userId
          ? [
              {
                id: `${item.kind}:${item.entityId}`,
                userId,
                entityId: item.entityId,
                dayId: item.dayId,
                localDate: day.localDate,
                kind: item.kind,
                title: item.title,
                preview: item.text.slice(0, 220),
                normalizedText: normalizeSearchText(item.text),
                updatedAt: item.updatedAt,
              },
            ]
          : [];
      })
      .slice(0, Math.min(limit, 100));
  }

  async trackers(userId: string, includeArchived = false): Promise<TrackerDefinition[]> {
    const rows = await this.database.trackerDefinitions
      .where("userId")
      .equals(userId)
      .filter(active)
      .sortBy("name");
    return includeArchived ? rows : rows.filter((item) => !item.archivedAt);
  }

  async createTracker(input: {
    userId: string;
    name: string;
    description?: string;
    type: TrackerType;
    options?: string[];
    unit?: string;
    pinned?: boolean;
  }): Promise<TrackerDefinition> {
    const timestamp = nowIso();
    const record: TrackerDefinition = {
      id: newEntityId(),
      userId: input.userId,
      name: input.name.trim(),
      description: input.description?.trim() ?? "",
      type: input.type,
      options: input.options?.map((item) => item.trim()).filter(Boolean) ?? [],
      unit: input.unit?.trim() ?? "",
      pinned: input.pinned ?? false,
      archivedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      version: 0,
      syncState: "pending",
      deletedAt: null,
    };
    if (!record.name) throw new Error("A tracker needs a name");
    await this.database.transaction(
      "rw",
      [this.database.trackerDefinitions, this.database.outbox],
      async () => {
        await this.database.trackerDefinitions.add(record);
        await this.database.outbox.add(this.operation("tracker_definition", record.id, record));
      },
    );
    return record;
  }

  async updateTracker(
    id: string,
    changes: Partial<
      Pick<TrackerDefinition, "name" | "description" | "options" | "unit" | "pinned">
    > & { archived?: boolean },
  ): Promise<void> {
    const current = await this.database.trackerDefinitions.get(id);
    if (!current || current.deletedAt) return;
    const updated: TrackerDefinition = {
      ...current,
      ...changes,
      archivedAt:
        changes.archived === undefined ? current.archivedAt : changes.archived ? nowIso() : null,
      updatedAt: nowIso(),
      version: current.version + 1,
      syncState: "pending",
    };
    await this.database.trackerDefinitions.put(updated);
    await this.database.outbox.add(this.operation("tracker_definition", id, updated));
  }

  async saveTrackerEntry(input: {
    userId: string;
    trackerId: string;
    localDate: LocalDate;
    timeZone: string;
    value: TrackerValue;
    note?: string;
  }): Promise<TrackerEntry> {
    const tracker = await this.database.trackerDefinitions.get(input.trackerId);
    if (!tracker || tracker.userId !== input.userId || tracker.deletedAt || tracker.archivedAt)
      throw new Error("Tracker not available");
    let day = await this.database.days
      .where("[userId+localDate]")
      .equals([input.userId, input.localDate])
      .first();
    if (!day) {
      day = createDay(input);
      await this.database.days.add(day);
      await this.database.outbox.add(this.operation("day", day.id, day));
    }
    const current = await this.database.trackerEntries
      .where("[userId+trackerId+localDate]")
      .equals([input.userId, input.trackerId, input.localDate])
      .filter(active)
      .first();
    const timestamp = nowIso();
    const entry: TrackerEntry = current
      ? {
          ...current,
          value: input.value,
          note: input.note?.trim() ?? "",
          occurredAt: `${input.localDate}T12:00:00.000Z`,
          updatedAt: timestamp,
          version: current.version + 1,
          syncState: "pending",
        }
      : {
          id: newEntityId(),
          userId: input.userId,
          trackerId: input.trackerId,
          dayId: day.id,
          localDate: input.localDate,
          value: input.value,
          note: input.note?.trim() ?? "",
          occurredAt: `${input.localDate}T12:00:00.000Z`,
          createdAt: timestamp,
          updatedAt: timestamp,
          version: 0,
          syncState: "pending",
          deletedAt: null,
        };
    await this.database.trackerEntries.put(entry);
    await this.database.outbox.add(this.operation("tracker_entry", entry.id, entry));
    await refreshDayDerived(this.database, input.userId, day.id);
    return entry;
  }

  async trackerEntries(
    userId: string,
    trackerId: string,
    start: LocalDate,
    end: LocalDate,
  ): Promise<TrackerEntry[]> {
    return this.database.trackerEntries
      .where("[userId+trackerId+localDate]")
      .between([userId, trackerId, start], [userId, trackerId, end], true, true)
      .filter(active)
      .toArray();
  }

  async monthReflection(userId: string, month: string): Promise<MonthlyReflection | undefined> {
    return this.database.monthlyReflections
      .where("[userId+month]")
      .equals([userId, month])
      .filter(active)
      .first();
  }

  async saveMonthReflection(
    userId: string,
    month: string,
    body: string,
  ): Promise<MonthlyReflection> {
    const current = await this.monthReflection(userId, month);
    const timestamp = nowIso();
    const record: MonthlyReflection = current
      ? {
          ...current,
          body,
          updatedAt: timestamp,
          version: current.version + 1,
          syncState: "pending",
        }
      : {
          id: newEntityId(),
          userId,
          month,
          body,
          createdAt: timestamp,
          updatedAt: timestamp,
          version: 0,
          syncState: "pending",
          deletedAt: null,
        };
    await this.database.monthlyReflections.put(record);
    await this.database.outbox.add(this.operation("monthly_reflection", record.id, record));
    return record;
  }

  private async seedMissingJournalSummaries(userId: string): Promise<void> {
    const entries = await this.database.journalEntries
      .where("userId")
      .equals(userId)
      .filter(active)
      .toArray();
    const existing = new Set(
      (await this.database.journalSummaries.bulkGet(entries.map((entry) => entry.id)))
        .filter(Boolean)
        .map((item) => item!.id),
    );
    const missingDayIds = [
      ...new Set(entries.filter((entry) => !existing.has(entry.id)).map((entry) => entry.dayId)),
    ];
    for (const dayId of missingDayIds) await refreshDayDerived(this.database, userId, dayId);
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
