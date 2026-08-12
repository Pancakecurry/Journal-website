"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { DaySummary } from "@/domain/history";
import { getApplicationDatabase } from "@/infrastructure/local/database";
import { LocalHistoryRepository } from "@/infrastructure/local/history-repository";
import { currentDayContext, LOCAL_FOUNDATION_USER_ID, readableDate } from "@/lib/journal-session";
import styles from "./day-index.module.css";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function DayIndex() {
  const today = useMemo(() => currentDayContext().localDate, []);
  const [cursor, setCursor] = useState(() => today.slice(0, 7));
  const [summaries, setSummaries] = useState<DaySummary[] | null>(null);
  const [selected, setSelected] = useState<DaySummary | null>(null);
  const repository = useMemo(() => new LocalHistoryRepository(getApplicationDatabase()), []);
  useEffect(() => {
    let alive = true;
    setSummaries(null);
    void repository.month(LOCAL_FOUNDATION_USER_ID, cursor).then((rows) => {
      if (alive) setSummaries(rows);
    });
    return () => {
      alive = false;
    };
  }, [cursor, repository]);
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
    setCursor(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`);
    setSelected(null);
  }
  return (
    <section className={styles.calendar}>
      <header>
        <div>
          <p>Calendar · notebook</p>
          <h1>When was that again?</h1>
          <span>Marks mean something lives there—not that you won the day.</span>
        </div>
        <Link href={`/calendar/${cursor}/recap`}>Open monthly recap</Link>
      </header>
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
                  summary ? setSelected(summary) : location.assign(`/day/${localDate}`)
                }
              >
                <time dateTime={localDate}>{number}</time>
                {summary ? (
                  <span className={styles.marks} aria-label={summaryLabel(summary)}>
                    {summary.mood ? <i data-mark="mood" /> : null}
                    {summary.photoCount ? <i data-mark="photo" /> : null}
                    {summary.journalCount ? <i data-mark="journal" /> : null}
                    {summary.momentCount || summary.reflectionCount || summary.trackerCount ? (
                      <i data-mark="note" />
                    ) : null}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
      {selected ? (
        <aside className={styles.preview} aria-labelledby="day-preview-title">
          <button
            className={styles.close}
            onClick={() => setSelected(null)}
            aria-label="Close day preview"
          >
            ×
          </button>
          <p>Day preview</p>
          <h2 id="day-preview-title">{readableDate(selected.localDate)}</h2>
          <strong>{selected.preview || "A few things are tucked into this page."}</strong>
          <span>{summaryLabel(selected)}</span>
          <Link href={`/day/${selected.localDate}`}>Open the Day</Link>
        </aside>
      ) : null}
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
