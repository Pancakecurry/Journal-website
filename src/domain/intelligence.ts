import { z } from "zod";
import { IsoTimestampSchema, LocalDateSchema } from "@/domain/shared";

export const AiSourceKindSchema = z.enum([
  "moment",
  "journal",
  "reflection",
  "photo_caption",
  "tracker",
  "monthly_reflection",
  "doodle",
]);
export type AiSourceKind = z.infer<typeof AiSourceKindSchema>;

export const AiContentScopesSchema = z.object({
  moment: z.boolean(),
  journal: z.boolean(),
  reflection: z.boolean(),
  photo_caption: z.boolean(),
  tracker: z.boolean(),
  monthly_reflection: z.boolean(),
  doodle: z.boolean(),
});
export type AiContentScopes = z.infer<typeof AiContentScopesSchema>;

export const DEFAULT_AI_SCOPES: AiContentScopes = {
  moment: false,
  journal: false,
  reflection: false,
  photo_caption: false,
  tracker: false,
  monthly_reflection: false,
  doodle: false,
};

export interface SemanticChunk {
  id: string;
  userId: string;
  sourceKind: AiSourceKind;
  sourceId: string;
  dayId: string | null;
  localDate: z.infer<typeof LocalDateSchema> | null;
  title: string;
  text: string;
  chunkIndex: number;
  chunkCount: number;
  contentFingerprint: string;
  provider: string;
  model: string;
  dimensions: number;
  vector: number[];
  sourceUpdatedAt: string;
  indexedAt: string;
}

export interface SemanticIndexState {
  userId: string;
  schemaVersion: number;
  provider: string;
  model: string;
  status: "idle" | "indexing" | "ready" | "paused" | "failed";
  completedSources: number;
  totalSources: number;
  lastIndexedAt: string | null;
  lastError: string | null;
}

export interface SemanticResult {
  chunk: SemanticChunk;
  semanticScore: number;
  lexicalScore: number;
  score: number;
}

export const AiAnswerSchema = z.object({
  answer: z.string().min(1).max(4_000),
  sourceIds: z.array(z.string()).max(12),
  uncertainty: z.string().max(500).nullable(),
});
export type AiAnswer = z.infer<typeof AiAnswerSchema>;

export const AiProviderStatusSchema = z.object({
  available: z.boolean(),
  provider: z.string(),
  generationModel: z.string(),
  embeddingModel: z.string(),
  externalProcessing: z.boolean(),
  checkedAt: IsoTimestampSchema.optional(),
});
