import Dexie, { type EntityTable } from "dexie";
import type { Day } from "@/domain/day";
import type { JournalEntry } from "@/domain/journal-entry";
import type { LocalMedia } from "@/domain/media";
import type { Moment } from "@/domain/moment";
import type { UserPreferences } from "@/domain/preferences";
import type { Reflection } from "@/domain/reflection";
import type { OutboxOperation, SyncMeta } from "@/domain/sync";

export class JournalDatabase extends Dexie {
  days!: EntityTable<Day, "id">;
  moments!: EntityTable<Moment, "id">;
  journalEntries!: EntityTable<JournalEntry, "id">;
  media!: EntityTable<LocalMedia, "id">;
  reflections!: EntityTable<Reflection, "id">;
  preferences!: EntityTable<UserPreferences, "userId">;
  outbox!: EntityTable<OutboxOperation, "operationId">;
  syncMeta!: EntityTable<SyncMeta, "userId">;

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
