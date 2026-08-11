import { z } from "zod";
import { EntityIdSchema, IsoTimestampSchema, SyncStateSchema } from "@/domain/shared";

export const UserPreferencesSchema = z.object({
  userId: EntityIdSchema,
  accent: z.enum(["powder", "sage", "lavender", "butter", "peach", "coral", "mint"]),
  reflectionEnabled: z.boolean(),
  reducedMotionOverride: z.enum(["system", "reduce", "full"]),
  createdAt: IsoTimestampSchema,
  updatedAt: IsoTimestampSchema,
  syncState: SyncStateSchema,
});
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
