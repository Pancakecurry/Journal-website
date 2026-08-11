import { z } from "zod";
import {
  EntityIdSchema,
  IsoTimestampSchema,
  LocalDateSchema,
  SyncStateSchema,
  newEntityId,
  nowIso,
} from "@/domain/shared";

export const DaySchema = z.object({
  id: EntityIdSchema,
  userId: EntityIdSchema,
  localDate: LocalDateSchema,
  timeZone: z.string().min(1),
  createdAt: IsoTimestampSchema,
  updatedAt: IsoTimestampSchema,
  version: z.number().int().nonnegative(),
  syncState: SyncStateSchema,
  deletedAt: IsoTimestampSchema.nullable(),
});
export type Day = z.infer<typeof DaySchema>;

export function createDay(input: Pick<Day, "userId" | "localDate" | "timeZone">): Day {
  const timestamp = nowIso();
  return DaySchema.parse({
    ...input,
    id: newEntityId(),
    createdAt: timestamp,
    updatedAt: timestamp,
    version: 0,
    syncState: "pending",
    deletedAt: null,
  });
}
