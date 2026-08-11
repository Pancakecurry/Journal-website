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
  z.object({
    kind: z.literal("mood"),
    mood: z.enum(["bright", "good", "okay", "off", "rough"]),
  }),
  z.object({ kind: z.literal("photo"), mediaId: EntityIdSchema }),
  z.object({ kind: z.literal("journal"), journalEntryId: EntityIdSchema }),
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
export type MomentContent = z.infer<typeof MomentContentSchema>;

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

export function createMoment(
  input: Pick<Moment, "userId" | "dayId"> & {
    content: MomentContent;
    occurredAt?: string;
  },
): Moment {
  const timestamp = nowIso();
  return MomentSchema.parse({
    id: newEntityId(),
    userId: input.userId,
    dayId: input.dayId,
    occurredAt: input.occurredAt ?? timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    content: input.content,
    version: 0,
    syncState: "pending",
    deletedAt: null,
  });
}
