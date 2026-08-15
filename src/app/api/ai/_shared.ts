import type { NextRequest } from "next/server";
import { getAiConfiguration, getRemoteConfiguration } from "@/config/env";
import type { AiSourceKind } from "@/domain/intelligence";
import { readConsentGrant } from "@/infrastructure/ai/consent-grant";
import { OpenAiServerProvider } from "@/infrastructure/ai/openai-provider";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

const windows = new Map<string, { count: number; resetsAt: number }>();

export async function authorizeIdentity(request: NextRequest): Promise<Response | null> {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin)
    return Response.json({ error: "Cross-site AI requests are not allowed." }, { status: 403 });
  const remote = getRemoteConfiguration();
  if (remote.configured) {
    const supabase = await createSupabaseServerClient();
    const result = await supabase?.auth.getUser();
    if (result?.error || !result?.data.user)
      return Response.json({ error: "Sign in before using external AI." }, { status: 401 });
  } else if (process.env.NODE_ENV === "production") {
    return Response.json(
      { error: "External AI is unavailable until private identity is configured." },
      { status: 503 },
    );
  }
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const current = windows.get(key);
  if (!current || current.resetsAt <= now) windows.set(key, { count: 1, resetsAt: now + 60_000 });
  else if (++current.count > 30)
    return Response.json({ error: "Too many AI requests. Give it a minute." }, { status: 429 });
  return null;
}

export async function authorizeScopedAiRequest(
  request: NextRequest,
  sourceKinds: AiSourceKind[],
): Promise<Response | null> {
  const denied = await authorizeIdentity(request);
  if (denied) return denied;
  const configuration = getAiConfiguration();
  if (!configuration.configured)
    return Response.json({ error: "AI is not configured on this journal yet." }, { status: 503 });
  const grant = await readConsentGrant(configuration.consentSecret);
  if (!grant)
    return Response.json(
      { error: "AI consent is missing or expired. Review your AI privacy choices." },
      { status: 403 },
    );
  const allowed = new Set(grant.scopes);
  if (sourceKinds.some((kind) => !allowed.has(kind)))
    return Response.json(
      { error: "That content category is outside your AI consent." },
      { status: 403 },
    );
  return null;
}

export function configuredProvider() {
  const configuration = getAiConfiguration();
  return configuration.configured ? new OpenAiServerProvider(configuration) : null;
}

export function rejectOversizedPayload(
  request: NextRequest,
  maximumBytes: number,
): Response | null {
  const declared = Number(request.headers.get("content-length") ?? "0");
  return Number.isFinite(declared) && declared > maximumBytes
    ? Response.json({ error: "That AI request is too large." }, { status: 413 })
    : null;
}
