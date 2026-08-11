import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getRemoteConfiguration } from "@/config/env";

export async function createSupabaseServerClient() {
  const configuration = getRemoteConfiguration();
  if (!configuration.configured) return null;
  const cookieStore = await cookies();
  return createServerClient(configuration.url, configuration.publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write cookies. The root proxy refreshes them.
        }
      },
    },
  });
}
