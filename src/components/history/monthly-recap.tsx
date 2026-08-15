"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DaySummary, MonthlyReflection, TrackerDefinition } from "@/domain/history";
import { getApplicationDatabase } from "@/infrastructure/local/database";
import { LocalHistoryRepository } from "@/infrastructure/local/history-repository";
import { LOCAL_FOUNDATION_USER_ID } from "@/lib/journal-session";
import styles from "./monthly-recap.module.css";

export function MonthlyRecap({ month }: { month: string }) {
  const repository = useMemo(() => new LocalHistoryRepository(getApplicationDatabase()), []);
  const [days, setDays] = useState<DaySummary[] | null>(null);
  const [trackers, setTrackers] = useState<TrackerDefinition[]>([]);
  const [reflection, setReflection] = useState<MonthlyReflection>();
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("Opening the month…");
  const hydrated = useRef(false);
  useEffect(() => {
    let alive = true;
    void Promise.all([
      repository.month(LOCAL_FOUNDATION_USER_ID, month),
      repository.trackers(LOCAL_FOUNDATION_USER_ID),
      repository.monthReflection(LOCAL_FOUNDATION_USER_ID, month),
    ]).then(([monthDays, trackerRows, writing]) => {
      if (!alive) return;
      setDays(monthDays);
      setTrackers(trackerRows);
      setReflection(writing);
      setBody(writing?.body ?? "");
      hydrated.current = true;
      setStatus("Month ready.");
    });
    return () => {
      alive = false;
    };
  }, [month, repository]);
  useEffect(() => {
    if (!hydrated.current) return;
    setStatus("Saving your note…");
    const task = window.setTimeout(
      () =>
        void repository.saveMonthReflection(LOCAL_FOUNDATION_USER_ID, month, body).then((item) => {
          setReflection(item);
          setStatus("Saved on this device.");
        }),
      700,
    );
    return () => window.clearTimeout(task);
  }, [body, month, repository]);
  const date = new Date(`${month}-01T12:00:00`);
  const totals = days?.reduce(
    (sum, item) => ({
      moments: sum.moments + item.momentCount,
      journals: sum.journals + item.journalCount,
      photos: sum.photos + item.photoCount,
      reflections: sum.reflections + item.reflectionCount,
      trackers: sum.trackers + item.trackerCount,
    }),
    { moments: 0, journals: 0, photos: 0, reflections: 0, trackers: 0 },
  );
  return (
    <article className={styles.recap}>
      <header>
        <p>Monthly recap · desk</p>
        <h1>
          {new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(date)}
        </h1>
        <span>A look back, not a report card.</span>
        <Link href="/calendar">Back to Calendar</Link>
      </header>
      {days === null ? (
        <p>Gathering the pages…</p>
      ) : (
        <>
          <section className={styles.stats} aria-label="Month at a glance">
            <div>
              <strong>{days.length}</strong>
              <span>Days with something</span>
            </div>
            <div>
              <strong>{totals!.moments}</strong>
              <span>Little moments</span>
            </div>
            <div>
              <strong>{totals!.journals}</strong>
              <span>Journal pages</span>
            </div>
            <div>
              <strong>{totals!.photos}</strong>
              <span>Photos</span>
            </div>
          </section>
          <section className={styles.pages}>
            <div>
              <p>Pages that stand out</p>
              <h2>
                {days.length ? "A few corners to revisit" : "A quiet month is still a month."}
              </h2>
            </div>
            {days
              .slice()
              .sort(
                (a, b) =>
                  b.momentCount +
                  b.journalCount +
                  b.photoCount -
                  (a.momentCount + a.journalCount + a.photoCount),
              )
              .slice(0, 6)
              .map((day) => (
                <Link key={day.id} href={`/day/${day.localDate}`}>
                  <time>{day.localDate.slice(-2)}</time>
                  <span>
                    {day.preview ||
                      `${day.momentCount + day.journalCount + day.photoCount} things live here`}
                  </span>
                </Link>
              ))}
          </section>
          {trackers.length && totals!.trackers ? (
            <section className={styles.trackerNote}>
              <p>Trackers showed up {totals!.trackers} times across this month.</p>
              <Link href="/me/trackers">Open tracker notebook</Link>
            </section>
          ) : null}
        </>
      )}
      <section className={styles.writing}>
        <label htmlFor="monthly-note">Anything worth saying about this month?</label>
        <textarea
          id="monthly-note"
          rows={8}
          value={body}
          disabled={days === null}
          onChange={(event) => setBody(event.target.value)}
          placeholder="It rained a lot. I finally tried that tiny café. Mostly, things were normal."
        />
        <p role="status" aria-label="Monthly reflection save status">
          {status}
          {reflection?.updatedAt
            ? ` Last tucked away ${new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(reflection.updatedAt))}.`
            : ""}
        </p>
      </section>
      <footer>
        <span>Filed with the cover you picked.</span>
      </footer>
    </article>
  );
}
