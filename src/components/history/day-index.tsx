"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { DaySummary } from "@/domain/history";
import { getApplicationDatabase } from "@/infrastructure/local/database";
import { LocalHistoryRepository } from "@/infrastructure/local/history-repository";
import { currentDayContext, LOCAL_FOUNDATION_USER_ID, readableDate } from "@/lib/journal-session";
import styles from "./day-index.module.css";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function DayIndex() {
  const reduceMotion = useReducedMotion();
  const today = useMemo(() => currentDayContext().localDate, []);
  const router = useRouter();
  const [cursor, setCursor] = useState(() => today.slice(0, 7));
  const [loadedMonth, setLoadedMonth] = useState<{
    cursor: string;
    summaries: DaySummary[];
  } | null>(null);
  const [selected, setSelected] = useState<DaySummary | null>(null);
  const [direction, setDirection] = useState(1);
  const repository = useMemo(() => new LocalHistoryRepository(getApplicationDatabase()), []);
  useEffect(() => {
    let alive = true;
    void repository.month(LOCAL_FOUNDATION_USER_ID, cursor).then((rows) => {
      if (alive) setLoadedMonth({ cursor, summaries: rows });
    });
    return () => {
      alive = false;
    };
  }, [cursor, repository]);
  const summaries = loadedMonth?.cursor === cursor ? loadedMonth.summaries : null;
  const date = new Date(`${cursor}-01T12:00:00`);
  const first = (date.getDay() + 6) % 7;
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const byDate = new Map(summaries?.map((item) => [item.localDate, item]));
  const cells = Array.from({ length: Math.ceil((first + daysInMonth) / 7) * 7 }, (_, index) => {
    const day = index - first + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });
  function moveMonth(amount: number) {
    const next = new Date(`${cursor}-01T12:00:00`);
    next.setMonth(next.getMonth() + amount);
    setDirection(amount);
    setCursor(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`);
    setSelected(null);
  }
  return (
    <section className={styles.calendar}>
      <header>
        <div>
          <p>Calendar</p>
          <h1>When was that again?</h1>
          <span>Marks mean something lives there. They are not a score.</span>
        </div>
      </header>
      <div className={styles.calendarStage}>
        <div className={styles.planner}>
          <div className={styles.monthControls}>
            <button onClick={() => moveMonth(-1)} aria-label="Previous month">
              ←
            </button>
            <h2 aria-live="polite">
              {new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(date)}
            </h2>
            <button onClick={() => moveMonth(1)} aria-label="Next month">
              →
            </button>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              className={styles.monthPage}
              key={cursor}
              initial={reduceMotion ? false : { opacity: 0, x: direction * 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, x: direction * -14 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className={styles.weekdays} aria-hidden="true">
                {WEEKDAYS.map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              {summaries === null ? (
                <div className={styles.loading}>Lining up the pages…</div>
              ) : (
                <div className={styles.grid} aria-label="Month planner">
                  {cells.map((number, index) => {
                    if (!number) return <span className={styles.blank} key={`blank-${index}`} />;
                    const localDate = `${cursor}-${String(number).padStart(2, "0")}`;
                    const summary = byDate.get(localDate as DaySummary["localDate"]);
                    return (
                      <button
                        key={localDate}
                        className={`${styles.day} ${localDate === today ? styles.today : ""}`}
                        onClick={() =>
                          summary ? setSelected(summary) : router.push(`/day/${localDate}`)
                        }
                      >
                        <time dateTime={localDate}>{number}</time>
                        {summary ? (
                          <span className={styles.marks} aria-label={summaryLabel(summary)}>
                            {summary.mood ? <i data-mark="mood" /> : null}
                            {summary.photoCount ? <i data-mark="photo" /> : null}
                            {summary.journalCount ? <i data-mark="journal" /> : null}
                            {summary.momentCount ||
                            summary.reflectionCount ||
                            summary.trackerCount ? (
                              <i data-mark="note" />
                            ) : null}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <aside className={styles.indexPanel} aria-live="polite">
          {selected ? (
            <div className={styles.preview} aria-labelledby="day-preview-title">
              <button
                className={styles.close}
                onClick={() => setSelected(null)}
                aria-label="Close day preview"
              >
                ×
              </button>
              <p>Open page</p>
              <h2 id="day-preview-title">{readableDate(selected.localDate)}</h2>
              <strong>{selected.preview || "A few things are tucked into this page."}</strong>
              <span>{summaryLabel(selected)}</span>
              <Link href={`/day/${selected.localDate}`}>Open the Day</Link>
            </div>
          ) : (
            <div className={styles.monthNote}>
              <span aria-hidden="true">{String(date.getMonth() + 1).padStart(2, "0")}</span>
              <h2>{summaries?.length ?? 0} days have something in them.</h2>
              <p>Pick a marked day for a quick look. Empty days open directly.</p>
              <Link href={`/calendar/${cursor}/recap`}>Open monthly recap</Link>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function summaryLabel(day: DaySummary) {
  const parts = [
    [day.momentCount, "moment"],
    [day.journalCount, "journal"],
    [day.photoCount, "photo"],
    [day.reflectionCount, "check-in"],
    [day.trackerCount, "tracker note"],
  ] as const;
  const text = parts
    .filter(([count]) => count)
    .map(([count, label]) => `${count} ${label}${count === 1 ? "" : "s"}`)
    .join(", ");
  return text || "Quiet Day";
}
