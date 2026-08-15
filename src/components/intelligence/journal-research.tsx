"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { RemoteAiProvider } from "@/application/ai-provider";
import { SemanticMemoryRepository } from "@/application/semantic-memory";
import type { AiAnswer, SemanticResult } from "@/domain/intelligence";
import { getApplicationDatabase } from "@/infrastructure/local/database";
import { LocalPersonalWorldRepository } from "@/infrastructure/local/personal-world-repository";
import { LOCAL_FOUNDATION_USER_ID, readableDate } from "@/lib/journal-session";
import styles from "./intelligence.module.css";

export function JournalResearch() {
  const database = useMemo(() => getApplicationDatabase(), []);
  const provider = useMemo(() => new RemoteAiProvider(), []);
  const semantic = useMemo(
    () => new SemanticMemoryRepository(database, provider),
    [database, provider],
  );
  const preferences = useMemo(() => new LocalPersonalWorldRepository(database), [database]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SemanticResult[]>([]);
  const [answer, setAnswer] = useState<AiAnswer>();
  const [mode, setMode] = useState<"find" | "ask">("find");
  const [status, setStatus] = useState("Try a subject, a person, or something half-remembered.");
  const [busy, setBusy] = useState(false);

  async function run(event: React.FormEvent) {
    event.preventDefault();
    const settings = await preferences.preferences(LOCAL_FOUNDATION_USER_ID);
    if (!settings.aiEnabled) {
      setStatus("AI is off. Turn it on from the privacy desk first.");
      return;
    }
    setBusy(true);
    setAnswer(undefined);
    setStatus("Looking through the selected parts of your journal…");
    try {
      const matches = await semantic.search(
        LOCAL_FOUNDATION_USER_ID,
        query,
        mode === "ask" ? 10 : 16,
      );
      setResults(matches);
      if (!matches.length) {
        setStatus("Nothing solid turned up. Try a different phrase or ordinary search.");
        return;
      }
      if (mode === "ask") {
        setStatus("A few relevant pages are going to the configured AI provider now.");
        const response = await provider.answer(query, semantic.groundingSources(matches));
        setAnswer(response);
      }
      setStatus(
        mode === "ask"
          ? "Answer ready. Check the source pages first."
          : `${matches.length} related pieces found.`,
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Journal research stopped.");
    } finally {
      setBusy(false);
    }
  }

  const cited = new Set(answer?.sourceIds ?? []);
  return (
    <main className={styles.researchPage}>
      <header className={styles.researchHero}>
        <p>Journal research desk</p>
        <h1>Follow a thread through your days.</h1>
        <span>
          Meaning-based search is optional. Ordinary Search remains local and right where you left
          it.
        </span>
      </header>
      <div className={styles.modeTabs} role="tablist" aria-label="Research mode">
        <button role="tab" aria-selected={mode === "find"} onClick={() => setMode("find")}>
          Explore by meaning
        </button>
        <button role="tab" aria-selected={mode === "ask"} onClick={() => setMode("ask")}>
          Ask My Journal
        </button>
      </div>
      <form className={styles.researchForm} onSubmit={(event) => void run(event)}>
        <label htmlFor="research-query">
          {mode === "ask"
            ? "What are you trying to remember?"
            : "What should these pages be about?"}
        </label>
        <div>
          <textarea
            id="research-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              mode === "ask"
                ? "When did I first write about moving?"
                : "university, late-night coffee, that project…"
            }
            maxLength={600}
          />
          <button disabled={busy || query.trim().length < 2}>
            {busy ? "Looking…" : mode === "ask" ? "Ask with sources" : "Find related pages"}
          </button>
        </div>
      </form>
      <p className={styles.live} role="status" aria-live="polite">
        {status}
      </p>
      {results.length ? (
        <section className={styles.sources} aria-labelledby="sources-title">
          <div className={styles.sectionHeading}>
            <div>
              <p>Index slips</p>
              <h2 id="sources-title">Source pages</h2>
            </div>
            <span>
              {mode === "ask" ? "Read these before the synthesis." : "Closest matches first."}
            </span>
          </div>
          <ol>
            {results.map((result, index) => (
              <li key={result.chunk.id} data-cited={cited.has(result.chunk.id)}>
                <span className={styles.sourceNumber}>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <p>
                    {result.chunk.sourceKind.replaceAll("_", " ")} ·{" "}
                    {result.chunk.localDate
                      ? readableDate(result.chunk.localDate, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "monthly note"}
                  </p>
                  <h3>
                    <Link href={sourceHref(result)}>{result.chunk.title}</Link>
                  </h3>
                  <blockquote>{result.chunk.text}</blockquote>
                </div>
                <meter
                  min="0"
                  max="1"
                  value={Math.max(0, result.score)}
                  aria-label={`Match score ${Math.round(result.score * 100)} percent`}
                />
              </li>
            ))}
          </ol>
        </section>
      ) : null}
      {answer ? (
        <section className={styles.answer}>
          <p>Grounded synthesis</p>
          <h2>Here’s what those pages support.</h2>
          <div>{answer.answer}</div>
          {answer.uncertainty ? <small>{answer.uncertainty}</small> : null}
          <p className={styles.ephemeral}>
            This answer disappears when you leave. The source pages stay yours.
          </p>
        </section>
      ) : null}
      <footer className={styles.researchFooter}>
        <Link href="/search">Use ordinary on-device Search</Link>
        <Link href="/me/privacy">Review AI privacy</Link>
      </footer>
    </main>
  );
}

function sourceHref(result: SemanticResult): string {
  if (result.chunk.sourceKind === "journal") return `/journal/${result.chunk.sourceId}`;
  if (result.chunk.sourceKind === "doodle") return `/my-world/doodles/${result.chunk.sourceId}`;
  if (result.chunk.sourceKind === "monthly_reflection" && result.chunk.title.match(/\d{4}-\d{2}/))
    return `/calendar/${result.chunk.title.match(/\d{4}-\d{2}/)![0]}/recap`;
  return result.chunk.localDate ? `/day/${result.chunk.localDate}` : "/journal";
}
