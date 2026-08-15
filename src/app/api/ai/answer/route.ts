import type { NextRequest } from "next/server";
import { z } from "zod";
import { AiSourceKindSchema } from "@/domain/intelligence";
import { authorizeScopedAiRequest, configuredProvider, rejectOversizedPayload } from "../_shared";

const SourceSchema = z.object({
  id: z.string().max(300),
  title: z.string().max(240),
  date: z.string().nullable(),
  kind: AiSourceKindSchema,
  text: z.string().max(4_000),
});
const RequestSchema = z.object({
  question: z.string().trim().min(2).max(600),
  sources: z.array(SourceSchema).min(1).max(8),
});
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const oversized = rejectOversizedPayload(request, 48_000);
  if (oversized) return oversized;
  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return Response.json({ error: "That journal question was not valid." }, { status: 400 });
  const denied = await authorizeScopedAiRequest(
    request,
    parsed.data.sources.map((source) => source.kind),
  );
  if (denied) return denied;
  try {
    return Response.json(
      await configuredProvider()!.answer(parsed.data.question, parsed.data.sources, request.signal),
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "The journal answer failed." },
      { status: 502 },
    );
  }
}
