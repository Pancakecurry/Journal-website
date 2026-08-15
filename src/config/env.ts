import { z } from "zod";

const optionalUrl = z.union([z.literal(""), z.url()]).optional();
const optionalSecret = (minimum: number) =>
  z.preprocess((value) => (value === "" ? undefined : value), z.string().min(minimum).optional());
const publicEnvironmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
});

export type RemoteConfiguration =
  { configured: false } | { configured: true; url: string; publishableKey: string };

export function getRemoteConfiguration(): RemoteConfiguration {
  const environment = publicEnvironmentSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  const url = environment.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) return { configured: false };
  return { configured: true, url, publishableKey };
}

const adminEnvironmentSchema = z.object({ SUPABASE_SERVICE_ROLE_KEY: optionalSecret(20) });
export function getSupabaseAdminKey(): string | null {
  return (
    adminEnvironmentSchema.parse({
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    }).SUPABASE_SERVICE_ROLE_KEY ?? null
  );
}

const aiEnvironmentSchema = z.object({
  AI_PROVIDER: z.enum(["openai"]).default("openai"),
  OPENAI_API_KEY: optionalSecret(1),
  AI_CONSENT_SECRET: optionalSecret(32),
  AI_GENERATION_MODEL: z.string().min(1).default("gpt-5-mini"),
  AI_EMBEDDING_MODEL: z.string().min(1).default("text-embedding-3-small"),
  AI_EMBEDDING_DIMENSIONS: z.coerce.number().int().min(128).max(3_072).default(512),
});

export type AiConfiguration =
  | { configured: false; provider: "openai"; generationModel: string; embeddingModel: string }
  | {
      configured: true;
      provider: "openai";
      apiKey: string;
      consentSecret: string;
      generationModel: string;
      embeddingModel: string;
      embeddingDimensions: number;
    };

export function getAiConfiguration(): AiConfiguration {
  const environment = aiEnvironmentSchema.parse({
    AI_PROVIDER: process.env.AI_PROVIDER,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    AI_CONSENT_SECRET: process.env.AI_CONSENT_SECRET,
    AI_GENERATION_MODEL: process.env.AI_GENERATION_MODEL,
    AI_EMBEDDING_MODEL: process.env.AI_EMBEDDING_MODEL,
    AI_EMBEDDING_DIMENSIONS: process.env.AI_EMBEDDING_DIMENSIONS,
  });
  if (!environment.OPENAI_API_KEY || !environment.AI_CONSENT_SECRET)
    return {
      configured: false,
      provider: environment.AI_PROVIDER,
      generationModel: environment.AI_GENERATION_MODEL,
      embeddingModel: environment.AI_EMBEDDING_MODEL,
    };
  return {
    configured: true,
    provider: environment.AI_PROVIDER,
    apiKey: environment.OPENAI_API_KEY,
    consentSecret: environment.AI_CONSENT_SECRET,
    generationModel: environment.AI_GENERATION_MODEL,
    embeddingModel: environment.AI_EMBEDDING_MODEL,
    embeddingDimensions: environment.AI_EMBEDDING_DIMENSIONS,
  };
}
