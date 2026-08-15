"use client";

import { useState } from "react";
import { useJournalIdentity } from "./journal-identity";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";
import { resetApplicationDatabaseReference } from "@/infrastructure/local/database";
import styles from "@/components/app-shell/app-shell.module.css";

export function SessionControl() {
  const identity = useJournalIdentity();
  const [busy, setBusy] = useState(false);
  if (!identity.configured) return <div className={styles.status}>Local-only notebook</div>;
  return (
    <button
      className={styles.signOut}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const client = createSupabaseBrowserClient();
        await client?.auth.signOut({ scope: "local" });
        resetApplicationDatabaseReference();
        window.location.replace("/auth");
      }}
    >
      {busy ? "Closing…" : "Sign out on this device"}
    </button>
  );
}
