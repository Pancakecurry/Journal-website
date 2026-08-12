import { z } from "zod";
import { EntityIdSchema, IsoTimestampSchema } from "@/domain/shared";

export const SyncEntitySchema = z.enum([
  "day",
  "moment",
  "journal_entry",
  "media",
  "reflection",
  "preferences",
  "bookmark",
  "tracker_definition",
  "tracker_entry",
  "monthly_reflection",
]);
export const SyncActionSchema = z.enum(["upsert", "delete"]);
export const OutboxStatusSchema = z.enum(["pending", "syncing", "failed", "conflict"]);

export const OutboxOperationSchema = z.object({
  operationId: EntityIdSchema,
  userId: EntityIdSchema,
  entityType: SyncEntitySchema,
  entityId: EntityIdSchema,
  action: SyncActionSchema,
  expectedVersion: z.number().int().nonnegative(),
  payload: z.unknown(),
  status: OutboxStatusSchema,
  attempts: z.number().int().nonnegative(),
  createdAt: IsoTimestampSchema,
  nextAttemptAt: IsoTimestampSchema,
  lastError: z.string().nullable(),
});
export type OutboxOperation = z.infer<typeof OutboxOperationSchema>;

export interface SyncMeta {
  userId: string;
  pullCursor: number;
  lastSyncedAt: string | null;
}
