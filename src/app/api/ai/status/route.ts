import { getAiConfiguration } from "@/config/env";

export const runtime = "nodejs";
export function GET() {
  const configuration = getAiConfiguration();
  return Response.json({
    available: configuration.configured,
    provider: "OpenAI",
    generationModel: configuration.generationModel,
    embeddingModel: configuration.embeddingModel,
    externalProcessing: configuration.configured,
    checkedAt: new Date().toISOString(),
  });
}
