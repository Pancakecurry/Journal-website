"use client";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { JournalExportService, type ExportProgress } from "@/application/journal-export";
import { getApplicationDatabase } from "@/infrastructure/local/database";
import { LOCAL_FOUNDATION_USER_ID } from "@/lib/journal-session";
import styles from "./privacy.module.css";

export function ExportCenter() {
  const service = useMemo(() => new JournalExportService(getApplicationDatabase()), []);
  const controller = useRef<AbortController | null>(null);
  const [progress, setProgress] = useState<ExportProgress>();
  const [message, setMessage] = useState("Nothing leaves this device until you press export.");
  const [busy, setBusy] = useState(false);

  async function download(kind: "json" | "markdown" | "complete") {
    setBusy(true);
    setProgress(undefined);
    controller.current = new AbortController();
    try {
      let blob: Blob;
      let extension: string;
      if (kind === "json") {
        const data = await service.structured(LOCAL_FOUNDATION_USER_ID);
        blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        extension = "json";
      } else if (kind === "markdown") {
        blob = new Blob([await service.markdown(LOCAL_FOUNDATION_USER_ID)], {
          type: "text/markdown",
        });
        extension = "md";
      } else {
        blob = await service.completeArchive(LOCAL_FOUNDATION_USER_ID, {
          signal: controller.current.signal,
          onProgress: setProgress,
        });
        extension = "zip";
      }
      saveBlob(blob, `campus-atelier-export-${new Date().toISOString().slice(0, 10)}.${extension}`);
      setMessage(
        kind === "complete"
          ? "Archive packed. Keep it somewhere private."
          : "Copy ready. Keep it somewhere private.",
      );
    } catch (error) {
      setMessage(
        error instanceof DOMException && error.name === "AbortError"
          ? "Export cancelled. No partial file was saved."
          : error instanceof Error
            ? error.message
            : "Export failed.",
      );
    } finally {
      setBusy(false);
      controller.current = null;
    }
  }
  return (
    <main className={styles.exportPage}>
      <header>
        <p>Data ownership · your exit door</p>
        <h1>Take the whole notebook with you.</h1>
        <span>No cloud detour. The archive is assembled here, on this device.</span>
      </header>
      <section className={styles.exportShelf}>
        <ExportCard
          number="01"
          title="Complete archive"
          detail="The useful one: versioned JSON, readable Markdown, local photos, and doodle previews in a ZIP."
          action="Pack everything"
          featured
          disabled={busy}
          onClick={() => void download("complete")}
        />
        <ExportCard
          number="02"
          title="Readable journal"
          detail="A plain Markdown copy arranged by Day. Easy to open without Campus Atelier."
          action="Download Markdown"
          disabled={busy}
          onClick={() => void download("markdown")}
        />
        <ExportCard
          number="03"
          title="Structured data"
          detail="Machine-readable JSON with canonical journal records and a versioned manifest."
          action="Download JSON"
          disabled={busy}
          onClick={() => void download("json")}
        />
      </section>
      {busy && progress ? (
        <div className={styles.progress}>
          <div>
            <span>{progress.stage}</span>
            <b>
              {progress.completed} / {progress.total}
            </b>
          </div>
          <progress max={progress.total} value={progress.completed} />
          <button onClick={() => controller.current?.abort()}>Cancel</button>
        </div>
      ) : null}
      <p className={styles.message} role="status" aria-live="polite">
        {message}
      </p>
      <aside className={styles.exportNote}>
        <b>What’s not tucked inside</b>
        <p>
          Derived semantic embeddings and temporary AI answers are excluded. Remote-only media that
          is not available on this device is reported in structured metadata but cannot be invented
          into the ZIP.
        </p>
      </aside>
      <nav className={styles.links}>
        <Link href="/me/import">Restore an archive</Link>
        <Link href="/me/privacy">AI privacy</Link>
        <Link href="/me/data">Delete local data</Link>
      </nav>
    </main>
  );
}

function ExportCard(props: {
  number: string;
  title: string;
  detail: string;
  action: string;
  featured?: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <article data-featured={props.featured}>
      <span>{props.number}</span>
      <h2>{props.title}</h2>
      <p>{props.detail}</p>
      <button disabled={props.disabled} onClick={props.onClick}>
        {props.action} <i aria-hidden="true">↘</i>
      </button>
    </article>
  );
}
function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
