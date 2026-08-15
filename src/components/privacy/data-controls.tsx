"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { JournalExportService } from "@/application/journal-export";
import { getApplicationDatabase } from "@/infrastructure/local/database";
import { LOCAL_FOUNDATION_USER_ID } from "@/lib/journal-session";
import { useJournalIdentity } from "@/components/auth/journal-identity";
import { useRouter } from "next/navigation";
import styles from "./privacy.module.css";

export function DataControls() {
  const identity = useJournalIdentity();
  const router = useRouter();
  const service = useMemo(() => new JournalExportService(getApplicationDatabase()), []);
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("This local journal has no pretend undo button.");
  async function remove() {
    const phrase = identity.configured ? "DELETE MY ACCOUNT" : "DELETE MY LOCAL JOURNAL";
    if (confirmation !== phrase) return;
    if (identity.configured) {
      const response = await fetch("/api/account", { method: "DELETE" });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(
          body?.error ??
            "Remote deletion did not finish. Your local journal was kept so you can retry.",
        );
        return;
      }
    }
    await fetch("/api/ai/consent", { method: "DELETE" }).catch(() => undefined);
    await service.deleteLocalUserData(LOCAL_FOUNDATION_USER_ID);
    setConfirmation("");
    if (identity.configured) {
      router.push("/auth?deleted=1");
      router.refresh();
    } else setMessage("Local journal data was deleted from this browser.");
  }
  return (
    <main className={styles.dataPage}>
      <header>
        <p>Data controls · careful bit</p>
        <h1>Your journal has an exit. And an eraser.</h1>
        <span>Export first if there’s anything you may want later.</span>
      </header>
      <section>
        <div>
          <p>Before deleting</p>
          <h2>Make a private copy</h2>
          <span>
            The complete archive includes the journal, locally available media, and a version
            manifest.
          </span>
          <Link href="/me/export">Open export desk</Link>
        </div>
        <div className={styles.deleteCard}>
          <p>{identity.configured ? "Account deletion" : "Local deletion"}</p>
          <h2>
            {identity.configured
              ? "Delete the account and its journal"
              : "Erase this browser’s journal"}
          </h2>
          <span>
            This removes Days, writing, photos stored here, trackers, keepsakes, doodles,
            preferences, search indexes, and derived AI data.{" "}
            {identity.configured
              ? "Private remote records, media, and the authenticated account are deleted first. Local data is erased only after the server confirms completion."
              : "No remote account is configured in this local checkout."}
          </span>
          <label htmlFor="delete-confirmation">
            Type <b>{identity.configured ? "DELETE MY ACCOUNT" : "DELETE MY LOCAL JOURNAL"}</b>
            <input
              id="delete-confirmation"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
            />
          </label>
          <button
            disabled={
              confirmation !==
              (identity.configured ? "DELETE MY ACCOUNT" : "DELETE MY LOCAL JOURNAL")
            }
            onClick={() => void remove()}
          >
            {identity.configured ? "Delete account and journal" : "Delete local journal data"}
          </button>
        </div>
      </section>
      <p role="status" aria-live="polite">
        {message}
      </p>
    </main>
  );
}
