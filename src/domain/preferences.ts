import { z } from "zod";
import { EntityIdSchema, IsoTimestampSchema, SyncStateSchema } from "@/domain/shared";
import { AiContentScopesSchema, DEFAULT_AI_SCOPES } from "@/domain/intelligence";

export const AccentSchema = z.enum([
  "powder",
  "sage",
  "lavender",
  "butter",
  "peach",
  "coral",
  "mint",
]);
export const PaperCharacterSchema = z.enum(["clean", "ruled", "dot", "grid"]);
export const NotebookCoverSchema = z.enum(["canvas", "navy", "sage", "lavender", "ochre"]);
export const EnvironmentDensitySchema = z.enum(["minimal", "standard", "expressive"]);

export const UserPreferencesSchema = z.object({
  userId: EntityIdSchema,
  accent: AccentSchema,
  paper: PaperCharacterSchema.default("clean"),
  notebookCover: NotebookCoverSchema.default("canvas"),
  environmentDensity: EnvironmentDensitySchema.default("standard"),
  reflectionEnabled: z.boolean(),
  reducedMotionOverride: z.enum(["system", "reduce", "full"]),
  memoryResurfacingEnabled: z.boolean().default(true),
  memoryRangeYears: z.number().int().min(1).max(10).default(5),
  onboardingComplete: z.boolean().default(false),
  aiEnabled: z.boolean().default(false),
  aiExternalProcessingConsent: z.boolean().default(false),
  aiContentScopes: AiContentScopesSchema.default(DEFAULT_AI_SCOPES),
  createdAt: IsoTimestampSchema,
  updatedAt: IsoTimestampSchema,
  version: z.number().int().nonnegative().default(0),
  syncState: SyncStateSchema,
});
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

export type Accent = z.infer<typeof AccentSchema>;
export type PaperCharacter = z.infer<typeof PaperCharacterSchema>;
export type NotebookCover = z.infer<typeof NotebookCoverSchema>;
export type EnvironmentDensity = z.infer<typeof EnvironmentDensitySchema>;
