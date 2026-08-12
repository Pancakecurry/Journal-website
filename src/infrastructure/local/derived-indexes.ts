import type { DaySummary, SearchDocument, SearchTerm } from "@/domain/history";
import { journalPreview, normalizeSearchText, searchTokens } from "@/domain/history";
import type { JournalDatabase } from "@/infrastructure/local/database";

const active = (record: { deletedAt: string | null }) => record.deletedAt === null;

export async function refreshDayDerived(
  database: JournalDatabase,
  userId: string,
  dayId: string,
): Promise<void> {
  const day = await database.days.get(dayId);
  if (!day || day.userId !== userId || day.deletedAt) {
    await database.daySummaries.delete(dayId);
    return;
  }
  const [moments, journals, media, reflections, trackerEntries, bookmarks] = await Promise.all([
    database.moments.where("[userId+dayId]").equals([userId, dayId]).filter(active).toArray(),
    database.journalEntries
      .where("[userId+dayId]")
      .equals([userId, dayId])
      .filter(active)
      .toArray(),
    database.media.where("[userId+dayId]").equals([userId, dayId]).filter(active).toArray(),
    database.reflections.where("[userId+dayId]").equals([userId, dayId]).filter(active).toArray(),
    database.trackerEntries
      .where("[userId+localDate]")
      .equals([userId, day.localDate])
      .filter(active)
      .toArray(),
    database.bookmarks.where("userId").equals(userId).filter(active).toArray(),
  ]);
  const mood = moments.find((item) => item.content.kind === "mood");
  const text = moments.find((item) => item.content.kind === "text");
  const newest = [
    day.updatedAt,
    ...moments.map((item) => item.updatedAt),
    ...journals.map((item) => item.updatedAt),
  ]
    .sort()
    .at(-1)!;
  const summary: DaySummary = {
    id: day.id,
    userId,
    localDate: day.localDate,
    mood: mood?.content.kind === "mood" ? mood.content.mood : null,
    momentCount: moments.filter((item) => item.content.kind === "text").length,
    journalCount: journals.length,
    photoCount: media.length,
    reflectionCount: reflections.length,
    trackerCount: trackerEntries.length,
    preview: text?.content.kind === "text" ? journalPreview(text.content.text, 100) : "",
    updatedAt: newest,
  };
  await database.daySummaries.put(summary);

  const bookmarked = new Set(bookmarks.map((item) => item.journalEntryId));
  await database.journalSummaries.bulkPut(
    journals.map((entry) => ({
      id: entry.id,
      userId,
      dayId,
      localDate: day.localDate,
      title: entry.title,
      preview: journalPreview(entry.body),
      wordCount: entry.body.trim() ? entry.body.trim().split(/\s+/u).length : 0,
      bookmarked: bookmarked.has(entry.id),
      updatedAt: entry.updatedAt,
    })),
  );

  const documents: SearchDocument[] = [];
  for (const moment of moments) {
    if (moment.content.kind !== "text") continue;
    documents.push(
      documentFor({
        id: `moment:${moment.id}`,
        entityId: moment.id,
        userId,
        dayId,
        localDate: day.localDate,
        kind: "moment",
        title: "Moment",
        text: moment.content.text,
        updatedAt: moment.updatedAt,
      }),
    );
  }
  for (const entry of journals) {
    documents.push(
      documentFor({
        id: `journal:${entry.id}`,
        entityId: entry.id,
        userId,
        dayId,
        localDate: day.localDate,
        kind: "journal",
        title: entry.title || "Untitled journal page",
        text: `${entry.title ?? ""} ${entry.body}`,
        updatedAt: entry.updatedAt,
      }),
    );
  }
  for (const item of media) {
    if (!item.caption) continue;
    documents.push(
      documentFor({
        id: `photo:${item.id}`,
        entityId: item.id,
        userId,
        dayId,
        localDate: day.localDate,
        kind: "photo",
        title: "Photo caption",
        text: item.caption,
        updatedAt: item.updatedAt,
      }),
    );
  }
  for (const item of reflections) {
    const answerText = item.answers
      .filter((answer) => !answer.skipped)
      .map((answer) => answer.answer)
      .join(" ");
    if (!answerText) continue;
    documents.push(
      documentFor({
        id: `reflection:${item.id}`,
        entityId: item.id,
        userId,
        dayId,
        localDate: day.localDate,
        kind: "reflection",
        title: item.period === "morning" ? "Morning check-in" : "Evening wrap-up",
        text: answerText,
        updatedAt: item.updatedAt,
      }),
    );
  }
  for (const entry of trackerEntries) {
    const definition = await database.trackerDefinitions.get(entry.trackerId);
    documents.push(
      documentFor({
        id: `tracker:${entry.id}`,
        entityId: entry.id,
        userId,
        dayId,
        localDate: day.localDate,
        kind: "tracker",
        title: definition?.name ?? "Tracker entry",
        text: `${definition?.name ?? "Tracker"} ${String(entry.value)} ${entry.note}`,
        updatedAt: entry.updatedAt,
      }),
    );
  }
  const oldDocumentIds = (
    await database.searchDocuments
      .where("[userId+localDate]")
      .equals([userId, day.localDate])
      .primaryKeys()
  ).map(String);
  if (oldDocumentIds.length) {
    await database.searchDocuments.bulkDelete(oldDocumentIds);
    await database.searchTerms.where("documentId").anyOf(oldDocumentIds).delete();
  }
  if (documents.length) {
    await database.searchDocuments.bulkPut(documents);
    const terms: SearchTerm[] = documents.flatMap((document) =>
      searchTokens(`${document.title} ${document.normalizedText} ${document.localDate}`).map(
        (token) => ({
          id: `${userId}:${token}:${document.id}`,
          userId,
          token,
          documentId: document.id,
        }),
      ),
    );
    if (terms.length) await database.searchTerms.bulkPut(terms);
  }
}

function documentFor(input: {
  id: string;
  entityId: string;
  userId: string;
  dayId: string;
  localDate: SearchDocument["localDate"];
  kind: SearchDocument["kind"];
  title: string;
  text: string;
  updatedAt: string;
}): SearchDocument {
  return {
    ...input,
    preview: journalPreview(input.text, 220),
    normalizedText: normalizeSearchText(input.text),
  };
}
