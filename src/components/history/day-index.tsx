"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Day } from "@/domain/day";
import { getApplicationDatabase } from "@/infrastructure/local/database";
import { LocalJournalRepository } from "@/infrastructure/local/journal-repository";
import { currentDayContext, LOCAL_FOUNDATION_USER_ID, readableDate } from "@/lib/journal-session";
import styles from "./day-index.module.css";
export function DayIndex() {
  const repo = useMemo(() => new LocalJournalRepository(getApplicationDatabase()), []);
  const [days, setDays] = useState<Day[] | null>(null);
  const today = useMemo(() => currentDayContext().localDate, []);
  useEffect(() => {
    void repo.listDays(LOCAL_FOUNDATION_USER_ID).then(setDays);
  }, [repo]);
  const yesterday = new Date(`${today}T12:00:00`);
  yesterday.setDate(yesterday.getDate() - 1);
  const previous = currentDayContext(yesterday).localDate;
  return (
    <section className={styles.calendar}>
      <header>
        <p>Calendar · notebook</p>
        <h1>When was that again?</h1>
        <span>A simple index for now. The full planner comes in Phase 3.</span>
      </header>
      {days === null ? (
        <p>Checking your pages…</p>
      ) : (
        <div className={styles.list}>
          <Link href={`/day/${previous}`}>
            <time>{readableDate(previous)}</time>
            <span>Open yesterday</span>
            <i aria-hidden="true" />
          </Link>
          {days
            .filter((day) => day.localDate !== previous && day.localDate !== today)
            .map((day) => (
              <Link key={day.id} href={`/day/${day.localDate}`}>
                <time>{readableDate(day.localDate)}</time>
                <span>Something lives here</span>
                <i aria-hidden="true" />
              </Link>
            ))}
        </div>
      )}
    </section>
  );
}
