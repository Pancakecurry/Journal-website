"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Moment } from "@/domain/moment";
import { localDateFor } from "@/domain/shared";
import { getApplicationDatabase } from "@/infrastructure/local/database";
import { LocalJournalRepository } from "@/infrastructure/local/journal-repository";
import { DateMark, Label, Sheet, DeskSurface } from "@/design-system/surfaces";
import styles from "./today-foundation.module.css";

export const FOUNDATION_USER_ID = "00000000-0000-4000-8000-000000000001";

export function TodayFoundation() {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("Restoring this Day from your device…");
  const [saving, setSaving] = useState(false);
  const timeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", []);
  const localDate = useMemo(() => localDateFor(new Date(), timeZone), [timeZone]);
  const repository = useMemo(() => new LocalJournalRepository(getApplicationDatabase()), []);

  const load = useCallback(async () => {
    const result = await repository.getDay(FOUNDATION_USER_ID, localDate);
    setMoments(result.moments);
    setStatus(result.moments.length ? "Available locally on this device." : "This Day is ready.");
  }, [localDate, repository]);

  useEffect(() => {
    const restoreTask = window.setTimeout(() => {
      void load().catch(() =>
        setStatus("Local data could not be opened. Your data was not cleared."),
      );
    }, 0);
    return () => window.clearTimeout(restoreTask);
  }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim() || saving) return;
    setSaving(true);
    setStatus("Placing this on Today…");
    try {
      await repository.addTextMoment({ userId: FOUNDATION_USER_ID, localDate, timeZone, text });
      setText("");
      await load();
      setStatus(
        navigator.onLine
          ? "Saved locally · waiting for configured sync."
          : "Saved locally while offline.",
      );
    } catch {
      setStatus("This could not be saved. Your text is still here so you can try again.");
    } finally {
      setSaving(false);
    }
  }

  const dateLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <DeskSurface>
      <Sheet>
        <header className={styles.headerRow}>
          <div>
            <Label>Today</Label>
            <h1 className={styles.title}>A place for this Day.</h1>
            <p className={styles.intro}>
              Quietly ready for whatever happened—one sentence is enough.
            </p>
          </div>
          <DateMark>{dateLabel}</DateMark>
        </header>

        <section className={styles.capture} id="foundation-capture" aria-labelledby="capture-title">
          <h2 id="capture-title">What happened?</h2>
          <p className={styles.scope}>
            Foundation capture: proves durable local text storage. Final Quick Capture arrives in
            Phase 2.
          </p>
          <form className={styles.form} onSubmit={submit}>
            <label>
              <span style={{ position: "absolute", clip: "rect(0 0 0 0)" }}>
                A moment from today
              </span>
              <input
                className={styles.input}
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Had ramen after class."
                maxLength={20_000}
              />
            </label>
            <button className={styles.button} type="submit" disabled={saving || !text.trim()}>
              {saving ? "Saving…" : "Place"}
            </button>
          </form>
          <p className={styles.status} role="status" aria-live="polite">
            {status}
          </p>
        </section>

        <section className={styles.timeline} aria-labelledby="today-timeline-title">
          <h2 id="today-timeline-title">This Day</h2>
          {moments.length === 0 ? (
            <p className={styles.empty}>
              Nothing needs to be filled in. This page can remain quiet.
            </p>
          ) : (
            <ol className={styles.moments}>
              {moments.map((moment) => (
                <li className={styles.moment} key={moment.id}>
                  <time className={styles.time} dateTime={moment.occurredAt}>
                    {new Intl.DateTimeFormat(undefined, {
                      hour: "numeric",
                      minute: "2-digit",
                    }).format(new Date(moment.occurredAt))}
                  </time>
                  <p className={styles.text}>
                    {moment.content.kind === "text" ? moment.content.text : ""}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </Sheet>
    </DeskSurface>
  );
}
