import { z } from "zod";
import {
  EntityIdSchema,
  IsoTimestampSchema,
  SyncStateSchema,
  newEntityId,
  nowIso,
} from "@/domain/shared";

export const ReflectionPeriodSchema = z.enum(["morning", "evening"]);
export const ReflectionAnswerSchema = z.object({
  questionId: z.string().min(1).max(80),
  answer: z.string().max(10_000),
  skipped: z.boolean(),
});
export type ReflectionAnswer = z.infer<typeof ReflectionAnswerSchema>;
export const ReflectionSchema = z.object({
  id: EntityIdSchema,
  userId: EntityIdSchema,
  dayId: EntityIdSchema,
  period: ReflectionPeriodSchema,
  answers: z.array(ReflectionAnswerSchema),
  currentQuestion: z.number().int().nonnegative(),
  completedAt: IsoTimestampSchema.nullable(),
  createdAt: IsoTimestampSchema,
  updatedAt: IsoTimestampSchema,
  version: z.number().int().nonnegative(),
  syncState: SyncStateSchema,
  deletedAt: IsoTimestampSchema.nullable(),
});
export type Reflection = z.infer<typeof ReflectionSchema>;
export type ReflectionPeriod = z.infer<typeof ReflectionPeriodSchema>;

export function createReflection(input: {
  userId: string;
  dayId: string;
  period: ReflectionPeriod;
}): Reflection {
  const timestamp = nowIso();
  return ReflectionSchema.parse({
    ...input,
    id: newEntityId(),
    answers: [],
    currentQuestion: 0,
    completedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    version: 0,
    syncState: "pending",
    deletedAt: null,
  });
}
