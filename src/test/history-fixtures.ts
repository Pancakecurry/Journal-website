import type { Day } from "@/domain/day";
import type { JournalEntry } from "@/domain/journal-entry";
import type { Moment } from "@/domain/moment";
import {
  journalPreview,
  normalizeSearchText,
  searchTokens,
  type DaySummary,
  type JournalSummary,
  type SearchDocument,
  type SearchTerm,
} from "@/domain/history";
import type { JournalDatabase } from "@/infrastructure/local/database";

export type HistoryFixtureSize = "several" | "year" | "large";
export async function seedHistoryFixture(
  database: JournalDatabase,
  userId: string,
  size: HistoryFixtureSize,
) {
  const count = size === "several" ? 8 : size === "year" ? 365 : 1_050;
  const days: Day[] = [];
  const moments: Moment[] = [];
  const journals: JournalEntry[] = [];
  const summaries: DaySummary[] = [];
  const journalSummaries: JournalSummary[] = [];
  const documents: SearchDocument[] = [];
  const terms: SearchTerm[] = [];
  const anchor = new Date("2026-08-12T12:00:00.000Z");
  const topics = [
    "ramen after class",
    "called home",
    "rain on the library window",
    "ordinary Tuesday",
    "movie night",
  ];
  for (let index = 0; index < count; index += 1) {
    const date = new Date(anchor);
    date.setUTCDate(date.getUTCDate() - index);
    const localDate = date.toISOString().slice(0, 10) as Day["localDate"];
    const timestamp = `${localDate}T12:00:00.000Z`;
    const dayId = id(index * 10 + 1, userId);
    const day: Day = {
      id: dayId,
      userId,
      localDate,
      timeZone: "UTC",
      createdAt: timestamp,
      updatedAt: timestamp,
      version: 0,
      syncState: "synced",
      deletedAt: null,
    };
    days.push(day);
    const dayMoments: Moment[] = [];
    for (let item = 0; item < (size === "large" ? 3 : 1); item += 1) {
      const moment: Moment = {
        id: id(index * 10 + item + 2, userId),
        userId,
        dayId,
        occurredAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
        content: {
          kind: "text",
          text: `${topics[(index + item) % topics.length]} · fixture ${index}`,
        },
        version: 0,
        syncState: "synced",
        deletedAt: null,
      };
      moments.push(moment);
      dayMoments.push(moment);
      const text = moment.content.kind === "text" ? moment.content.text : "";
      const document: SearchDocument = {
        id: `moment:${moment.id}`,
        userId,
        entityId: moment.id,
        dayId,
        localDate,
        kind: "moment",
        title: "Moment",
        preview: journalPreview(text, 220),
        normalizedText: normalizeSearchText(text),
        updatedAt: timestamp,
      };
      documents.push(document);
      terms.push(
        ...searchTokens(`${text} ${localDate}`).map((token) => ({
          id: `${userId}:${token}:${document.id}`,
          userId,
          token,
          documentId: document.id,
        })),
      );
    }
    let journalCount = 0;
    if (index % 3 === 0) {
      journalCount = 1;
      const entry: JournalEntry = {
        id: id(20000 + index, userId),
        userId,
        dayId,
        title: index % 2 ? "A regular day" : "Notes from campus",
        body: `Longer thoughts about ${topics[index % topics.length]}. `.repeat(12),
        createdAt: timestamp,
        updatedAt: timestamp,
        version: 0,
        syncState: "synced",
        deletedAt: null,
      };
      journals.push(entry);
      journalSummaries.push({
        id: entry.id,
        userId,
        dayId,
        localDate,
        title: entry.title,
        preview: journalPreview(entry.body),
        wordCount: entry.body.trim().split(/\s+/).length,
        bookmarked: false,
        updatedAt: timestamp,
      });
    }
    summaries.push({
      id: dayId,
      userId,
      localDate,
      mood: null,
      momentCount: dayMoments.length,
      journalCount,
      photoCount: 0,
      reflectionCount: 0,
      trackerCount: 0,
      preview:
        dayMoments[0]?.content.kind === "text"
          ? journalPreview(dayMoments[0].content.text, 100)
          : "",
      updatedAt: timestamp,
    });
  }
  await database.transaction(
    "rw",
    [
      database.days,
      database.moments,
      database.journalEntries,
      database.daySummaries,
      database.journalSummaries,
      database.searchDocuments,
      database.searchTerms,
    ],
    async () => {
      await database.days.bulkPut(days);
      await database.moments.bulkPut(moments);
      await database.journalEntries.bulkPut(journals);
      await database.daySummaries.bulkPut(summaries);
      await database.journalSummaries.bulkPut(journalSummaries);
      await database.searchDocuments.bulkPut(documents);
      await database.searchTerms.bulkPut(terms);
    },
  );
  return { days: days.length, moments: moments.length, journals: journals.length };
}
function id(value: number, userId: string) {
  const ownerOffset = Number.parseInt(userId[0] ?? "0", 16) * 1_000_000;
  return `10000000-0000-4000-8000-${(ownerOffset + value).toString(16).padStart(12, "0")}`;
}
