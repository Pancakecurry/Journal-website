import { cookies } from "next/headers";
import { z } from "zod";
import { AiSourceKindSchema, type AiSourceKind } from "@/domain/intelligence";

const COOKIE_NAME = "campus_atelier_ai_consent";
const MAX_AGE_SECONDS = 60 * 60 * 8;
const PayloadSchema = z.object({
  scopes: z.array(AiSourceKindSchema).min(1),
  issuedAt: z.number().int(),
  expiresAt: z.number().int(),
});
export type ConsentGrant = z.infer<typeof PayloadSchema>;

export async function issueConsentGrant(secret: string, scopes: AiSourceKind[]): Promise<void> {
  const issuedAt = Math.floor(Date.now() / 1_000);
  const payload: ConsentGrant = {
    scopes: [...new Set(scopes)],
    issuedAt,
    expiresAt: issuedAt + MAX_AGE_SECONDS,
  };
  const encoded = encode(JSON.stringify(payload));
  const signature = await sign(encoded, secret);
  const store = await cookies();
  store.set(COOKIE_NAME, `${encoded}.${signature}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/api/ai",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function revokeConsentGrant(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/api/ai",
    maxAge: 0,
  });
}

export async function readConsentGrant(secret: string): Promise<ConsentGrant | null> {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  if (!value) return null;
  const separator = value.lastIndexOf(".");
  if (separator < 1) return null;
  const encoded = value.slice(0, separator);
  const supplied = value.slice(separator + 1);
  const expected = await sign(encoded, secret);
  if (!constantTimeEqual(supplied, expected)) return null;
  try {
    const parsed = PayloadSchema.parse(JSON.parse(decode(encoded)));
    return parsed.expiresAt > Math.floor(Date.now() / 1_000) ? parsed : null;
  } catch {
    return null;
  }
}

function encode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}
function decode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}
async function sign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const bytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Buffer.from(bytes).toString("base64url");
}
function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1)
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}
