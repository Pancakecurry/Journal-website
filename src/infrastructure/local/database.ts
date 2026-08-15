import Dexie, { type EntityTable } from "dexie";
import type { Day } from "@/domain/day";
import type { JournalEntry } from "@/domain/journal-entry";
import type { LocalMedia } from "@/domain/media";
import type { Moment } from "@/domain/moment";
import type { UserPreferences } from "@/domain/preferences";
import type { Reflection } from "@/domain/reflection";
import type { OutboxOperation, SyncMeta } from "@/domain/sync";
import type {
  Bookmark,
  DaySummary,
  JournalSummary,
  MonthlyReflection,
  SearchDocument,
  SearchTerm,
  TrackerDefinition,
  TrackerEntry,
} from "@/domain/history";
import type { Doodle, HiddenMemory, Keepsake } from "@/domain/personal-world";
import type { SemanticChunk, SemanticIndexState } from "@/domain/intelligence";

export class JournalDatabase extends Dexie {
  days!: EntityTable<Day, "id">;
  moments!: EntityTable<Moment, "id">;
  journalEntries!: EntityTable<JournalEntry, "id">;
  media!: EntityTable<LocalMedia, "id">;
  reflections!: EntityTable<Reflection, "id">;
  preferences!: EntityTable<UserPreferences, "userId">;
  outbox!: EntityTable<OutboxOperation, "operationId">;
  syncMeta!: EntityTable<SyncMeta, "userId">;
  daySummaries!: EntityTable<DaySummary, "id">;
  journalSummaries!: EntityTable<JournalSummary, "id">;
  searchDocuments!: EntityTable<SearchDocument, "id">;
  searchTerms!: EntityTable<SearchTerm, "id">;
  bookmarks!: EntityTable<Bookmark, "id">;
  trackerDefinitions!: EntityTable<TrackerDefinition, "id">;
  trackerEntries!: EntityTable<TrackerEntry, "id">;
  monthlyReflections!: EntityTable<MonthlyReflection, "id">;
  keepsakes!: EntityTable<Keepsake, "id">;
  doodles!: EntityTable<Doodle, "id">;
  hiddenMemories!: EntityTable<HiddenMemory, "id">;
  semanticChunks!: EntityTable<SemanticChunk, "id">;
  semanticIndexState!: EntityTable<SemanticIndexState, "userId">;

  constructor(name = "campus-atelier-journal") {
    super(name);

    this.version(1).stores({
      days: "id,userId,localDate",
      moments: "id,dayId,userId,createdAt",
      outbox: "operationId,status,createdAt",
    });

    this.version(2)
      .stores({
        days: "id,[userId+localDate],userId,updatedAt,syncState",
        moments: "id,[userId+dayId],dayId,userId,occurredAt,syncState",
        journalEntries: "id,[userId+dayId],dayId,userId,updatedAt,syncState",
        media: "id,[userId+dayId],dayId,userId,status,updatedAt,syncState",
        preferences: "userId,updatedAt,syncState",
        outbox: "operationId,status,entityType,createdAt,nextAttemptAt",
        syncMeta: "userId",
      })
      .upgrade(async (transaction) => {
        await transaction
          .table<Moment, string>("moments")
          .toCollection()
          .modify((moment) => {
            moment.syncState ??= "pending";
            moment.version ??= 0;
            moment.deletedAt ??= null;
            moment.updatedAt ??= moment.createdAt;
            moment.occurredAt ??= moment.createdAt;
          });
      });

    this.version(3)
      .stores({
        days: "id,[userId+localDate],userId,updatedAt,syncState",
        moments: "id,[userId+dayId],dayId,userId,occurredAt,syncState",
        journalEntries: "id,[userId+dayId],dayId,userId,updatedAt,syncState",
        media: "id,[userId+dayId],dayId,userId,status,updatedAt,syncState",
        reflections: "id,[userId+dayId],[userId+dayId+period],dayId,userId,updatedAt,syncState",
        preferences: "userId,updatedAt,syncState",
        outbox: "operationId,status,entityType,createdAt,nextAttemptAt",
        syncMeta: "userId",
      })
      .upgrade(async (transaction) => {
        await transaction
          .table<LocalMedia, string>("media")
          .toCollection()
          .modify((media) => {
            media.width ??= 1;
            media.height ??= 1;
            media.caption ??= "";
            media.uploadAttempts ??= 0;
            media.lastError ??= null;
          });
      });

    this.version(4).stores({
      days: "id,[userId+localDate],userId,updatedAt,syncState",
      moments: "id,[userId+dayId],dayId,userId,occurredAt,syncState",
      journalEntries: "id,[userId+dayId],dayId,userId,updatedAt,syncState",
      media: "id,[userId+dayId],dayId,userId,status,updatedAt,syncState",
      reflections: "id,[userId+dayId],[userId+dayId+period],dayId,userId,updatedAt,syncState",
      preferences: "userId,updatedAt,syncState",
      outbox: "operationId,status,entityType,createdAt,nextAttemptAt",
      syncMeta: "userId",
      daySummaries: "id,[userId+localDate],userId,updatedAt",
      journalSummaries: "id,[userId+updatedAt],[userId+localDate],userId,dayId,bookmarked",
      searchDocuments: "id,[userId+localDate],[userId+kind],userId,entityId,updatedAt",
      searchTerms: "id,[userId+token],documentId",
      bookmarks: "id,[userId+journalEntryId],userId,createdAt",
      trackerDefinitions: "id,[userId+name],userId,pinned,archivedAt,updatedAt",
      trackerEntries:
        "id,[userId+trackerId+localDate],[userId+localDate],userId,trackerId,dayId,updatedAt",
      monthlyReflections: "id,[userId+month],userId,updatedAt",
    });

    this.version(5)
      .stores({
        days: "id,[userId+localDate],userId,updatedAt,syncState",
        moments: "id,[userId+dayId],dayId,userId,occurredAt,syncState",
        journalEntries: "id,[userId+dayId],dayId,userId,updatedAt,syncState",
        media: "id,[userId+dayId],dayId,userId,status,updatedAt,syncState",
        reflections: "id,[userId+dayId],[userId+dayId+period],dayId,userId,updatedAt,syncState",
        preferences: "userId,updatedAt,syncState",
        outbox: "operationId,status,entityType,createdAt,nextAttemptAt",
        syncMeta: "userId",
        daySummaries: "id,[userId+localDate],userId,updatedAt",
        journalSummaries: "id,[userId+updatedAt],[userId+localDate],userId,dayId,bookmarked",
        searchDocuments: "id,[userId+localDate],[userId+kind],userId,entityId,updatedAt",
        searchTerms: "id,[userId+token],documentId",
        bookmarks: "id,[userId+journalEntryId],userId,createdAt",
        trackerDefinitions: "id,[userId+name],userId,pinned,archivedAt,updatedAt",
        trackerEntries:
          "id,[userId+trackerId+localDate],[userId+localDate],userId,trackerId,dayId,updatedAt",
        monthlyReflections: "id,[userId+month],userId,updatedAt",
        keepsakes:
          "id,[userId+createdAt],[userId+sourceType],[userId+sourceId],userId,dayId,deletedAt",
        doodles: "id,[userId+localDate],[userId+updatedAt],userId,dayId,deletedAt",
        hiddenMemories: "id,[userId+entityId],[userId+dayId],userId,deletedAt",
      })
      .upgrade(async (transaction) => {
        await transaction
          .table<UserPreferences, string>("preferences")
          .toCollection()
          .modify((preference) => {
            preference.paper ??= "clean";
            preference.notebookCover ??= "canvas";
            preference.environmentDensity ??= "standard";
            preference.memoryResurfacingEnabled ??= true;
            preference.memoryRangeYears ??= 5;
            preference.version ??= 0;
          });
      });

    this.version(6)
      .stores({
        days: "id,[userId+localDate],userId,updatedAt,syncState",
        moments: "id,[userId+dayId],dayId,userId,occurredAt,syncState",
        journalEntries: "id,[userId+dayId],dayId,userId,updatedAt,syncState",
        media: "id,[userId+dayId],dayId,userId,status,updatedAt,syncState",
        reflections: "id,[userId+dayId],[userId+dayId+period],dayId,userId,updatedAt,syncState",
        preferences: "userId,updatedAt,syncState",
        outbox: "operationId,status,entityType,createdAt,nextAttemptAt",
        syncMeta: "userId",
        daySummaries: "id,[userId+localDate],userId,updatedAt",
        journalSummaries: "id,[userId+updatedAt],[userId+localDate],userId,dayId,bookmarked",
        searchDocuments: "id,[userId+localDate],[userId+kind],userId,entityId,updatedAt",
        searchTerms: "id,[userId+token],documentId",
        bookmarks: "id,[userId+journalEntryId],userId,createdAt",
        trackerDefinitions: "id,[userId+name],userId,pinned,archivedAt,updatedAt",
        trackerEntries:
          "id,[userId+trackerId+localDate],[userId+localDate],userId,trackerId,dayId,updatedAt",
        monthlyReflections: "id,[userId+month],userId,updatedAt",
        keepsakes:
          "id,[userId+createdAt],[userId+sourceType],[userId+sourceId],userId,dayId,deletedAt",
        doodles: "id,[userId+localDate],[userId+updatedAt],userId,dayId,deletedAt",
        hiddenMemories: "id,[userId+entityId],[userId+dayId],userId,deletedAt",
        semanticChunks:
          "id,[userId+sourceKind],[userId+sourceId],userId,sourceId,sourceUpdatedAt,indexedAt",
        semanticIndexState: "userId,status,lastIndexedAt",
      })
      .upgrade(async (transaction) => {
        await transaction
          .table<UserPreferences, string>("preferences")
          .toCollection()
          .modify((preference) => {
            preference.aiEnabled ??= false;
            preference.aiExternalProcessingConsent ??= false;
            preference.aiContentScopes ??= {
              moment: false,
              journal: false,
              reflection: false,
              photo_caption: false,
              tracker: false,
              monthly_reflection: false,
              doodle: false,
            };
          });
      });
  }
}

let applicationDatabase: JournalDatabase | undefined;

export function getApplicationDatabase(): JournalDatabase {
  applicationDatabase ??= new JournalDatabase();
  return applicationDatabase;
}

export function resetApplicationDatabaseReference(): void {
  applicationDatabase?.close();
  applicationDatabase = undefined;
}
