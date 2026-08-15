"use client";

import { useMemo, useState } from "react";
import { JournalImportService, type ImportInspection } from "@/application/journal-import";
import { getApplicationDatabase } from "@/infrastructure/local/database";
import { LOCAL_FOUNDATION_USER_ID } from "@/lib/journal-session";
import styles from "./privacy.module.css";

export function ImportCenter() {
  const service = useMemo(() => new JournalImportService(getApplicationDatabase()), []);
  const [inspection, setInspection] = useState<ImportInspection | null>(null);
  const [message, setMessage] = useState(
    "Choose a Campus Atelier 1.0 ZIP or structured JSON archive. Nothing is changed during inspection.",
  );
  const [busy, setBusy] = useState(false);
  return (
    <main className={styles.importPage}>
      <header>
        <p>Restore · bring the notebook back</p>
        <h1>Inspect first. Restore second.</h1>
        <span>
          Existing history is preserved. Conflicting IDs become separate records instead of silent
          overwrites.
        </span>
      </header>
      <section className={styles.importDesk}>
        <label htmlFor="archive-file">
          Choose a private archive
          <input
            id="archive-file"
            type="file"
            accept=".zip,.json,application/zip,application/json"
            disabled={busy}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setBusy(true);
              setInspection(null);
              try {
                const checked = await service.inspect(file);
                setInspection(checked);
                setMessage("Archive checked. Review the summary before restoring.");
              } catch (error) {
                setMessage(
                  error instanceof Error ? error.message : "That archive could not be inspected.",
                );
              } finally {
                setBusy(false);
              }
            }}
          />
        </label>
        {inspection ? (
          <article className={styles.importSummary}>
            <p>Exported {new Date(inspection.summary.exportedAt).toLocaleString()}</p>
            <dl>
              <div>
                <dt>Days</dt>
                <dd>{inspection.summary.days}</dd>
              </div>
              <div>
                <dt>Moments</dt>
                <dd>{inspection.summary.moments}</dd>
              </div>
              <div>
                <dt>Journal pages</dt>
                <dd>{inspection.summary.journals}</dd>
              </div>
              <div>
                <dt>Photos</dt>
                <dd>{inspection.summary.photos}</dd>
              </div>
              <div>
                <dt>Doodles</dt>
                <dd>{inspection.summary.doodles}</dd>
              </div>
            </dl>
            <button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const result = await service.restore(LOCAL_FOUNDATION_USER_ID, inspection);
                  setMessage(
                    `Restore complete: ${result.imported} records added. ${result.preservedConflicts} conflicts were preserved separately${result.missingMedia ? `; ${result.missingMedia} media files were unavailable` : ""}.`,
                  );
                  setInspection(null);
                } catch {
                  setMessage("Restore stopped safely. The archive was not reported as complete.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Confirm and restore
            </button>
          </article>
        ) : null}
      </section>
      <p role="status" aria-live="polite">
        {busy ? "Working carefully…" : message}
      </p>
    </main>
  );
}
