import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getRemoteConfiguration, getSupabaseAdminKey } from "@/config/env";

export function createSupabaseAdminClient() {
  const configuration = getRemoteConfiguration();
  const serviceRoleKey = getSupabaseAdminKey();
  if (!configuration.configured || !serviceRoleKey) return null;
  return createClient(configuration.url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
