import { z } from "zod";
import {
  EntityIdSchema,
  IsoTimestampSchema,
  SyncStateSchema,
  newEntityId,
  nowIso,
} from "@/domain/shared";

export const JournalEntrySchema = z.object({
  id: EntityIdSchema,
  userId: EntityIdSchema,
  dayId: EntityIdSchema,
  title: z.string().max(240).nullable(),
  body: z.string(),
  createdAt: IsoTimestampSchema,
  updatedAt: IsoTimestampSchema,
  version: z.number().int().nonnegative(),
  syncState: SyncStateSchema,
  deletedAt: IsoTimestampSchema.nullable(),
});
export type JournalEntry = z.infer<typeof JournalEntrySchema>;

export function createJournalEntry(input: Pick<JournalEntry, "userId" | "dayId">): JournalEntry {
  const timestamp = nowIso();
  return JournalEntrySchema.parse({
    ...input,
    id: newEntityId(),
    title: null,
    body: "",
    createdAt: timestamp,
    updatedAt: timestamp,
    version: 0,
    syncState: "pending",
    deletedAt: null,
  });
}
