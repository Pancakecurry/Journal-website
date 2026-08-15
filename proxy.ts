import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getRemoteConfiguration } from "@/config/env";

export async function proxy(request: NextRequest) {
  const configuration = getRemoteConfiguration();
  if (!configuration.configured) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const client = createServerClient(configuration.url, configuration.publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data } = await client.auth.getClaims();
  const pathname = request.nextUrl.pathname;
  const isProductRoute =
    /^\/(today|calendar|day|journal|search|my-world|me|reflection|onboarding)(\/|$)/.test(pathname);
  if (isProductRoute && !data?.claims?.sub) {
    const authUrl = new URL("/auth", request.url);
    authUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(authUrl);
  }
  if (pathname === "/auth" && data?.claims?.sub)
    return NextResponse.redirect(new URL("/today", request.url));
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
