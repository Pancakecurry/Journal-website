import type { NextRequest } from "next/server";
import { z } from "zod";
import { getAiConfiguration } from "@/config/env";
import { AiSourceKindSchema } from "@/domain/intelligence";
import { issueConsentGrant, revokeConsentGrant } from "@/infrastructure/ai/consent-grant";
import { authorizeIdentity } from "../_shared";

const RequestSchema = z.object({
  confirmed: z.literal(true),
  scopes: z.array(AiSourceKindSchema).min(1),
});
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const denied = await authorizeIdentity(request);
  if (denied) return denied;
  const configuration = getAiConfiguration();
  if (!configuration.configured)
    return Response.json({ error: "AI is not configured on this journal yet." }, { status: 503 });
  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return Response.json(
      { error: "Choose at least one category and confirm external processing." },
      { status: 400 },
    );
  await issueConsentGrant(configuration.consentSecret, parsed.data.scopes);
  return Response.json({ granted: true, expiresInSeconds: 28_800 });
}

export async function DELETE(request: NextRequest) {
  const denied = await authorizeIdentity(request);
  if (denied) return denied;
  await revokeConsentGrant();
  return Response.json({ granted: false });
}
