"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useJournalIdentity } from "@/components/auth/journal-identity";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";
import { getApplicationDatabase } from "@/infrastructure/local/database";
import { DexieOutboxStore } from "@/infrastructure/local/dexie-outbox-store";
import { SupabaseSyncRemote } from "@/infrastructure/supabase/sync-remote";
import { SyncEngine } from "@/sync/engine";
import { LocalMediaRepository } from "@/infrastructure/local/media-repository";
import { uploadPrivateMedia } from "@/infrastructure/supabase/media-uploader";
import { SupabasePullService } from "@/infrastructure/supabase/sync-pull";
import styles from "./app-shell.module.css";

export function SyncCoordinator() {
  const identity = useJournalIdentity();
  const [label, setLabel] = useState(
    identity.configured ? "Sync ready" : "Remote sync not configured",
  );
  const engine = useMemo(() => {
    const client = createSupabaseBrowserClient();
    return client
      ? {
          client,
          engine: new SyncEngine(
            new DexieOutboxStore(getApplicationDatabase()),
            new SupabaseSyncRemote(client),
          ),
        }
      : null;
  }, []);
  const flush = useCallback(async () => {
    if (!engine || !navigator.onLine || !identity.userId) return;
    setLabel("Syncing private changes…");
    const mediaRepository = new LocalMediaRepository(getApplicationDatabase());
    for (const media of (await mediaRepository.listPending(identity.userId)).slice(0, 4)) {
      try {
        await mediaRepository.markUploading(media.id);
        await mediaRepository.markUploaded(
          media.id,
          await uploadPrivateMedia(engine.client, media),
        );
      } catch (error) {
        await mediaRepository.markFailed(
          media.id,
          error instanceof Error
            ? error.message
            : "Photo upload is waiting. Your local copy is safe.",
        );
      }
    }
    const result = await engine.engine.flush();
    await new SupabasePullService(getApplicationDatabase(), engine.client).pull(identity.userId);
    setLabel(
      result.conflicts
        ? `${result.conflicts} change${result.conflicts === 1 ? "" : "s"} need review`
        : result.failed
          ? "Sync paused · local copy is safe"
          : "Synced",
    );
  }, [engine, identity.userId]);
  useEffect(() => {
    if (!identity.configured) return;
    const initial = window.setTimeout(() => void flush(), 0);
    const interval = window.setInterval(() => void flush(), 30_000);
    window.addEventListener("online", flush);
    window.addEventListener("campus-atelier:local-write", flush);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
      window.removeEventListener("online", flush);
      window.removeEventListener("campus-atelier:local-write", flush);
    };
  }, [flush, identity.configured]);
  return <div className={styles.status}>{label}</div>;
}
