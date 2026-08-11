import { z } from "zod";
import {
  EntityIdSchema,
  IsoTimestampSchema,
  SyncStateSchema,
  newEntityId,
  nowIso,
} from "@/domain/shared";

export const MomentContentSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("text"), text: z.string().trim().min(1).max(20_000) }),
]);

export const MomentSchema = z.object({
  id: EntityIdSchema,
  userId: EntityIdSchema,
  dayId: EntityIdSchema,
  occurredAt: IsoTimestampSchema,
  createdAt: IsoTimestampSchema,
  updatedAt: IsoTimestampSchema,
  content: MomentContentSchema,
  version: z.number().int().nonnegative(),
  syncState: SyncStateSchema,
  deletedAt: IsoTimestampSchema.nullable(),
});
export type Moment = z.infer<typeof MomentSchema>;

export function createTextMoment(
  input: Pick<Moment, "userId" | "dayId"> & { text: string; occurredAt?: string },
): Moment {
  const timestamp = nowIso();
  return MomentSchema.parse({
    id: newEntityId(),
    userId: input.userId,
    dayId: input.dayId,
    occurredAt: input.occurredAt ?? timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    content: { kind: "text", text: input.text },
    version: 0,
    syncState: "pending",
    deletedAt: null,
  });
}
