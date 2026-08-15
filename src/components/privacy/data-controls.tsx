"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { JournalExportService } from "@/application/journal-export";
import { getApplicationDatabase } from "@/infrastructure/local/database";
import { LOCAL_FOUNDATION_USER_ID } from "@/lib/journal-session";
import styles from "./privacy.module.css";

export function DataControls() {
  const service = useMemo(() => new JournalExportService(getApplicationDatabase()), []);
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("This local journal has no pretend undo button.");
  async function remove() {
    if (confirmation !== "DELETE MY LOCAL JOURNAL") return;
    await fetch("/api/ai/consent", { method: "DELETE" }).catch(() => undefined);
    await service.deleteLocalUserData(LOCAL_FOUNDATION_USER_ID);
    setConfirmation("");
    setMessage(
      "Local journal data was deleted from this browser. Remote deletion was not claimed or attempted.",
    );
  }
  return (
    <main className={styles.dataPage}>
      <header>
        <p>Data controls · careful bit</p>
        <h1>Your journal has an exit—and an eraser.</h1>
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
          <p>Local deletion</p>
          <h2>Erase this browser’s journal</h2>
          <span>
            This removes Days, writing, photos stored here, trackers, keepsakes, doodles,
            preferences, search indexes, and derived AI data. It does not claim to delete a remote
            account while remote identity is unconfigured.
          </span>
          <label htmlFor="delete-confirmation">
            Type <b>DELETE MY LOCAL JOURNAL</b>
            <input
              id="delete-confirmation"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
            />
          </label>
          <button
            disabled={confirmation !== "DELETE MY LOCAL JOURNAL"}
            onClick={() => void remove()}
          >
            Delete local journal data
          </button>
        </div>
      </section>
      <p role="status" aria-live="polite">
        {message}
      </p>
    </main>
  );
}
