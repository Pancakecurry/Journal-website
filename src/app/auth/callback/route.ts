import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const requested = request.nextUrl.searchParams.get("next");
  const next = requested?.startsWith("/") && !requested.startsWith("//") ? requested : "/today";
  const client = await createSupabaseServerClient();
  if (!code || !client) return NextResponse.redirect(new URL("/auth?error=callback", request.url));
  const { error } = await client.auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL(error ? "/auth?error=callback" : next, request.url));
}
