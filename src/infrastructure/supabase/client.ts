"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getRemoteConfiguration } from "@/config/env";

export function createSupabaseBrowserClient() {
  const configuration = getRemoteConfiguration();
  if (!configuration.configured) return null;
  return createBrowserClient(configuration.url, configuration.publishableKey);
}
