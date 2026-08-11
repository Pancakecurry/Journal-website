"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Day } from "@/domain/day";
import type { JournalEntry } from "@/domain/journal-entry";
import { getApplicationDatabase } from "@/infrastructure/local/database";
import { LocalJournalRepository } from "@/infrastructure/local/journal-repository";
import { LOCAL_FOUNDATION_USER_ID, readableDate } from "@/lib/journal-session";
import styles from "./journal-index.module.css";

export function JournalIndex() {
  const repository = useMemo(() => new LocalJournalRepository(getApplicationDatabase()), []);
  const [items, setItems] = useState<Array<{ entry: JournalEntry; day: Day }> | null>(null);
  useEffect(() => {
    void repository.listJournals(LOCAL_FOUNDATION_USER_ID).then(setItems);
  }, [repository]);
  return (
    <section className={styles.notebook}>
      <header>
        <p>Journal · notebook</p>
        <h1>The longer stuff.</h1>
        <span>Every page still belongs to its Day.</span>
      </header>
      {items === null ? (
        <p>Finding your pages…</p>
      ) : items.length === 0 ? (
        <div className={styles.empty}>
          <h2>No big entries yet.</h2>
          <p>{"Start one from Today whenever a one-liner won't cut it."}</p>
          <Link href="/today#quick-capture">Go to Today</Link>
        </div>
      ) : (
        <ol>
          {items.map(({ entry, day }) => (
            <li key={entry.id}>
              <span>
                {readableDate(day.localDate, { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <div>
                <h2>
                  <Link href={`/journal/${entry.id}`}>
                    {entry.title || "Untitled, which is fine"}
                  </Link>
                </h2>
                <p>
                  {entry.body
                    ? `${entry.body.slice(0, 220)}${entry.body.length > 220 ? "…" : ""}`
                    : "Blank page. Still counts as a page."}
                </p>
              </div>
              <Link href={`/day/${day.localDate}`}>See the Day</Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
