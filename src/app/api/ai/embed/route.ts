import type { NextRequest } from "next/server";
import { z } from "zod";
import { AiSourceKindSchema } from "@/domain/intelligence";
import { authorizeScopedAiRequest, configuredProvider, rejectOversizedPayload } from "../_shared";

const ItemSchema = z.object({
  kind: z.union([AiSourceKindSchema, z.literal("query")]),
  text: z.string().min(1).max(4_000),
});
const RequestSchema = z.object({ items: z.array(ItemSchema).min(1).max(24) });
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const oversized = rejectOversizedPayload(request, 120_000);
  if (oversized) return oversized;
  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return Response.json({ error: "That embedding request was not valid." }, { status: 400 });
  const kinds = parsed.data.items.flatMap((item) => (item.kind === "query" ? [] : [item.kind]));
  const denied = await authorizeScopedAiRequest(request, kinds);
  if (denied) return denied;
  try {
    const provider = configuredProvider()!;
    return Response.json(
      await provider.embed(
        parsed.data.items.map((item) => item.text),
        request.signal,
      ),
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Embedding failed." },
      { status: 502 },
    );
  }
}
