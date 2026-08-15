"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { JournalSummary } from "@/domain/history";
import { getApplicationDatabase } from "@/infrastructure/local/database";
import { LocalHistoryRepository } from "@/infrastructure/local/history-repository";
import { LOCAL_FOUNDATION_USER_ID, readableDate } from "@/lib/journal-session";
import styles from "./journal-index.module.css";
const PAGE_SIZE = 20;
export function JournalIndex() {
  const reduceMotion = useReducedMotion();
  const repository = useMemo(() => new LocalHistoryRepository(getApplicationDatabase()), []);
  const [items, setItems] = useState<JournalSummary[] | null>(null);
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const load = useCallback(
    async () =>
      setItems(
        await repository.journals(LOCAL_FOUNDATION_USER_ID, {
          limit: PAGE_SIZE,
          bookmarked: bookmarkedOnly,
        }),
      ),
    [bookmarkedOnly, repository],
  );
  useEffect(() => {
    const task = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(task);
  }, [load]);
  async function more() {
    if (!items?.length) return;
    setLoadingMore(true);
    const rows = await repository.journals(LOCAL_FOUNDATION_USER_ID, {
      cursor: items.at(-1)!.updatedAt,
      limit: PAGE_SIZE,
      bookmarked: bookmarkedOnly,
    });
    setItems([...items, ...rows.filter((row) => !items.some((item) => item.id === row.id))]);
    setLoadingMore(false);
  }
  async function bookmark(item: JournalSummary) {
    const value = await repository.toggleBookmark(LOCAL_FOUNDATION_USER_ID, item.id);
    setItems(
      (current) =>
        current?.map((row) => (row.id === item.id ? { ...row, bookmarked: value } : row)) ?? null,
    );
  }
  return (
    <section className={styles.notebook}>
      <motion.header
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <p>Journal</p>
          <h1>The longer stuff.</h1>
          <span>Previews stay light. Full pages open only when you ask.</span>
        </div>
        <div className={styles.libraryTools}>
          <small>{items?.length ?? 0} pages on this shelf</small>
          <label>
            <input
              type="checkbox"
              checked={bookmarkedOnly}
              onChange={(event) => setBookmarkedOnly(event.target.checked)}
            />
            <span>Bookmarked only</span>
          </label>
        </div>
      </motion.header>
      {items === null ? (
        <p className={styles.loading}>Finding your pages…</p>
      ) : items.length === 0 ? (
        <div className={styles.empty}>
          <h2>{bookmarkedOnly ? "No bookmarks yet." : "No big entries yet."}</h2>
          <p>
            {bookmarkedOnly
              ? "Mark a page you want handy."
              : "Start one from Today whenever a one-liner won't cut it."}
          </p>
          <Link href="/today#quick-capture">Go to Today</Link>
        </div>
      ) : (
        <>
          <ol className={styles.libraryGrid}>
            {items.map((entry, index) => (
              <motion.li
                key={entry.id}
                initial={
                  reduceMotion ? false : { opacity: 0, y: 18, rotate: index % 2 ? 0.3 : -0.3 }
                }
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{
                  duration: 0.42,
                  delay: reduceMotion ? 0 : Math.min(index, 6) * 0.045,
                }}
              >
                <time>
                  {readableDate(entry.localDate, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>
                <div>
                  <h2>
                    <Link href={`/journal/${entry.id}`}>
                      {entry.title || "Untitled, which is fine"}
                    </Link>
                  </h2>
                  <p>{entry.preview || "Blank page. Still counts as a page."}</p>
                  <small>{entry.wordCount} words</small>
                </div>
                <div className={styles.actions}>
                  <button onClick={() => void bookmark(entry)} aria-pressed={entry.bookmarked}>
                    {entry.bookmarked ? "Bookmarked" : "Bookmark"}
                  </button>
                  <Link href={`/day/${entry.localDate}`}>See the Day</Link>
                </div>
              </motion.li>
            ))}
          </ol>
          {items.length >= PAGE_SIZE ? (
            <button className={styles.more} disabled={loadingMore} onClick={() => void more()}>
              {loadingMore ? "Getting more pages…" : "More pages"}
            </button>
          ) : null}
        </>
      )}
    </section>
  );
}
