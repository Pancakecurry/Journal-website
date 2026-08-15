"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { SearchDocument } from "@/domain/history";
import { getApplicationDatabase } from "@/infrastructure/local/database";
import { LocalHistoryRepository } from "@/infrastructure/local/history-repository";
import { LocalPersonalWorldRepository } from "@/infrastructure/local/personal-world-repository";
import { LOCAL_FOUNDATION_USER_ID, readableDate } from "@/lib/journal-session";
import styles from "./search-experience.module.css";

export function SearchExperience() {
  const repository = useMemo(() => new LocalHistoryRepository(getApplicationDatabase()), []);
  const preferencesRepository = useMemo(
    () => new LocalPersonalWorldRepository(getApplicationDatabase()),
    [],
  );
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchDocument[]>([]);
  const [searched, setSearched] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  useEffect(() => {
    void preferencesRepository
      .preferences(LOCAL_FOUNDATION_USER_ID)
      .then((item) => setAiEnabled(item.aiEnabled));
  }, [preferencesRepository]);
  useEffect(() => {
    const task = window.setTimeout(() => {
      if (!query.trim()) {
        setResults([]);
        setSearched(false);
        return;
      }
      void repository.search(LOCAL_FOUNDATION_USER_ID, query).then((rows) => {
        setResults(rows);
        setSearched(true);
      });
    }, 220);
    return () => window.clearTimeout(task);
  }, [query, repository]);
  return (
    <section className={styles.search}>
      <header>
        <p>Search · notebook</p>
        <h1>Find that thing.</h1>
        <span>Runs on this device. No AI, no remote call, no mysterious remembering.</span>
      </header>
      <label htmlFor="journal-search">Search your words and dates</label>
      <input
        id="journal-search"
        autoFocus
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="ramen, 2026-08-12, called home…"
      />
      <p className={styles.status} role="status" aria-live="polite">
        {searched
          ? `${results.length} ${results.length === 1 ? "match" : "matches"}`
          : query
            ? "Looking through local pages…"
            : "Try a person, place, phrase, or date."}
      </p>
      {aiEnabled ? (
        <aside className={styles.researchNote}>
          <div>
            <span>Meaning index</span>
            <b>Looking for a theme instead of an exact word?</b>
          </div>
          <Link href="/journal/research">
            Open journal research <i aria-hidden="true">→</i>
          </Link>
        </aside>
      ) : null}
      {searched && !results.length ? (
        <div className={styles.empty}>
          <h2>Nope, nothing by that name.</h2>
          <p>Try fewer words or a date like 2026-08.</p>
        </div>
      ) : (
        <ol>
          {results.map((item) => (
            <li key={item.id}>
              <span>{item.kind}</span>
              <div>
                <h2>
                  <Link
                    href={
                      item.kind === "journal"
                        ? `/journal/${item.entityId}`
                        : `/day/${item.localDate}`
                    }
                  >
                    {item.title}
                  </Link>
                </h2>
                <p>{highlight(item.preview, query)}</p>
              </div>
              <time>
                {readableDate(item.localDate, { month: "short", day: "numeric", year: "numeric" })}
              </time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
function highlight(text: string, query: string) {
  const needle = query.trim();
  if (!needle) return text;
  const index = text.toLocaleLowerCase().indexOf(needle.toLocaleLowerCase());
  if (index < 0) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + needle.length)}</mark>
      {text.slice(index + needle.length)}
    </>
  );
}
