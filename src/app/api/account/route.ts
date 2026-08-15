import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";
import { revokeConsentGrant } from "@/infrastructure/ai/consent-grant";

export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request))
    return NextResponse.json({ error: "Request origin was not accepted." }, { status: 403 });
  const client = await createSupabaseServerClient();
  const { data, error } = client
    ? await client.auth.getUser()
    : { data: { user: null }, error: null };
  if (error || !data.user)
    return NextResponse.json(
      { error: "Sign in again before deleting the account." },
      { status: 401 },
    );
  const admin = createSupabaseAdminClient();
  if (!admin)
    return NextResponse.json(
      { error: "Account deletion is not configured on this deployment." },
      { status: 503 },
    );
  try {
    const paths = await listOwnedMedia(admin, data.user.id);
    if (paths.length) {
      const { error: mediaError } = await admin.storage.from("journal-media").remove(paths);
      if (mediaError) throw new Error("media_cleanup_failed");
    }
    const { error: deletionError } = await admin.auth.admin.deleteUser(data.user.id);
    if (deletionError) throw new Error("identity_deletion_failed");
    const response = NextResponse.json({ deleted: true });
    await revokeConsentGrant();
    response.cookies.delete("campus-atelier-ai-consent");
    return response;
  } catch {
    return NextResponse.json(
      { error: "Remote deletion did not finish. Your local copy was kept so you can retry." },
      { status: 502 },
    );
  }
}

async function listOwnedMedia(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  userId: string,
) {
  const paths: string[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await admin.storage
      .from("journal-media")
      .list(userId, { limit: 1000, offset });
    if (error) throw error;
    if (!data?.length) break;
    for (const entry of data) {
      if (entry.id) paths.push(`${userId}/${entry.name}`);
      else {
        const nested = await admin.storage
          .from("journal-media")
          .list(`${userId}/${entry.name}`, { limit: 1000 });
        if (nested.error) throw nested.error;
        for (const file of nested.data ?? [])
          if (file.id) paths.push(`${userId}/${entry.name}/${file.name}`);
      }
    }
    if (data.length < 1000) break;
  }
  return paths;
}

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin === request.nextUrl.origin);
}
