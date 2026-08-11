"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Day } from "@/domain/day";
import type { JournalEntry } from "@/domain/journal-entry";
import { getApplicationDatabase } from "@/infrastructure/local/database";
import { LocalJournalRepository } from "@/infrastructure/local/journal-repository";
import { readableDate } from "@/lib/journal-session";
import styles from "./journal-editor.module.css";

export function JournalEditor() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const repository = useMemo(() => new LocalJournalRepository(getApplicationDatabase()), []);
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [day, setDay] = useState<Day | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [editing, setEditing] = useState(true);
  const [status, setStatus] = useState("Opening your page…");
  const hydrated = useRef(false);

  useEffect(() => {
    void repository
      .getJournal(id)
      .then(async (found) => {
        if (!found) {
          setStatus("That page isn't on this device.");
          return;
        }
        setEntry(found);
        setTitle(found.title ?? "");
        setBody(found.body);
        setDay((await repository.getDayById(found.dayId)) ?? null);
        setEditing(!found.body);
        hydrated.current = true;
        setStatus("Saved on this device.");
      })
      .catch(() => setStatus("That page wouldn't open. Nothing was cleared."));
  }, [id, repository]);

  useEffect(() => {
    if (!entry || !hydrated.current || (title === (entry.title ?? "") && body === entry.body))
      return;
    setStatus("Saving…");
    const timeout = window.setTimeout(() => {
      void repository
        .saveJournal(entry.id, title, body)
        .then((saved) => {
          setEntry(saved);
          setStatus(
            navigator.onLine
              ? "Saved here · sync can happen later."
              : "Saved here while you're offline.",
          );
        })
        .catch(() => setStatus("Couldn't save that yet. Keep this tab open and try another edit."));
    }, 650);
    return () => window.clearTimeout(timeout);
  }, [body, entry, repository, title]);

  async function remove() {
    if (!entry || !window.confirm("Delete this journal page? The deletion will sync when it can."))
      return;
    await repository.deleteJournal(entry.id);
    router.push(day ? `/day/${day.localDate}` : "/today");
  }

  return (
    <article className={styles.paper}>
      <header className={styles.toolbar}>
        <div>
          {day ? (
            <Link href={`/day/${day.localDate}`}>← {readableDate(day.localDate)}</Link>
          ) : (
            <Link href="/today">← Today</Link>
          )}
          <span>Private page</span>
        </div>
        <div>
          <button onClick={() => setEditing((value) => !value)}>
            {editing ? "Done writing" : "Edit"}
          </button>
          <button className={styles.delete} onClick={() => void remove()}>
            Delete
          </button>
        </div>
      </header>
      {!entry ? (
        <p className={styles.message}>{status}</p>
      ) : editing ? (
        <div className={styles.editor}>
          <label>
            <span className="sr-only">Journal title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="A title, if you want one"
              maxLength={240}
            />
          </label>
          <label>
            <span className="sr-only">Journal entry</span>
            <textarea
              autoFocus
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Okay, so here's what happened…"
            />
          </label>
        </div>
      ) : (
        <div className={styles.reading}>
          <h1>{title || "Untitled, which is fine"}</h1>
          {body ? (
            body.split("\n").map((line, index) => <p key={index}>{line || <br />}</p>)
          ) : (
            <p className={styles.blank}>Still blank. No scandal here.</p>
          )}
        </div>
      )}
      <footer>
        <span role="status" aria-live="polite">
          {status}
        </span>
        {body ? <span>{body.trim().split(/\s+/).length} words</span> : <span>blank page</span>}
      </footer>
    </article>
  );
}
