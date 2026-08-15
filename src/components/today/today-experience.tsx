"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DayWithMoments } from "@/infrastructure/local/journal-repository";
import { LocalJournalRepository } from "@/infrastructure/local/journal-repository";
import { getApplicationDatabase } from "@/infrastructure/local/database";
import { currentDayContext, LOCAL_FOUNDATION_USER_ID, readableDate } from "@/lib/journal-session";
import { QuickCapture } from "./quick-capture";
import styles from "./today-experience.module.css";
import { PinnedTrackers } from "@/components/trackers/pinned-trackers";

const MOODS = [
  ["bright", "Great", "☀"],
  ["good", "Pretty good", "◡"],
  ["okay", "Okay-ish", "—"],
  ["off", "A bit off", "∿"],
  ["rough", "Rough", "☂"],
] as const;

const emptyBundle: DayWithMoments = {
  day: null,
  moments: [],
  journals: [],
  media: [],
  reflections: [],
  doodles: [],
};

export function TodayExperience() {
  const [bundle, setBundle] = useState(emptyBundle);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [status, setStatus] = useState("Getting today off your device…");
  const [ready, setReady] = useState(false);
  const context = useMemo(() => currentDayContext(), []);
  const repository = useMemo(() => new LocalJournalRepository(getApplicationDatabase()), []);
  const hour = new Date().getHours();
  const phase = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

  const load = useCallback(async () => {
    setBundle(await repository.getDay(LOCAL_FOUNDATION_USER_ID, context.localDate));
    setReady(true);
    setStatus((current) =>
      current === "Getting today off your device…" ? "Ready whenever." : current,
    );
  }, [context.localDate, repository]);

  useEffect(() => {
    const task = window.setTimeout(() => {
      void load().catch(() => {
        setReady(true);
        setStatus("Today wouldn't open. Nothing was cleared.");
      });
    }, 0);
    return () => window.clearTimeout(task);
  }, [load]);
  useEffect(() => {
    const openFromHash = () => {
      if (location.hash === "#quick-capture") setCaptureOpen(true);
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);

  const mood = bundle.moments.find((item) => item.content.kind === "mood");
  const reflection = bundle.reflections.find(
    (item) => item.period === (phase === "morning" ? "morning" : "evening"),
  );
  const contentMoments = bundle.moments.filter((item) => item.content.kind !== "mood");
  const mediaById = new Map(bundle.media.map((item) => [item.id, item]));
  const journalsById = new Map(bundle.journals.map((item) => [item.id, item]));
  const doodlesById = new Map(bundle.doodles.map((item) => [item.id, item]));

  async function setMood(value: (typeof MOODS)[number][0]) {
    await repository.setMood({ ...context, userId: LOCAL_FOUNDATION_USER_ID, mood: value });
    setStatus("Mood noted. That's it—no score attached.");
    await load();
  }

  async function remove(type: "moment" | "journal_entry" | "media", id: string) {
    if (!window.confirm("Take this off the page? It will also be queued for deletion on sync."))
      return;
    await repository.deleteEntity(type, id);
    setStatus("Taken off this Day.");
    await load();
  }

  async function removePhoto(momentId: string, mediaId: string) {
    if (!window.confirm("Take this photo off the page? The deletion will sync later too.")) return;
    await repository.deletePhotoMoment(momentId, mediaId);
    setStatus("Photo taken off this Day.");
    await load();
  }

  return (
    <div className={`${styles.desk} ${styles[phase]}`}>
      <div className={styles.mat} aria-hidden="true" />
      <article className={styles.daybook}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Today · {phase}</p>
            <h1>
              {phase === "morning"
                ? "Morning. What's up?"
                : phase === "afternoon"
                  ? "How's the day going?"
                  : "Okay, how was today?"}
            </h1>
            <p className={styles.date}>
              {readableDate(context.localDate, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <button className={styles.addButton} onClick={() => setCaptureOpen(true)}>
            + Add something
          </button>
        </header>

        <section className={styles.mood} aria-labelledby="mood-heading">
          <div>
            <p className={styles.sectionMark}>Quick mood</p>
            <h2 id="mood-heading">How are you, roughly?</h2>
          </div>
          <div className={styles.moodOptions}>
            {MOODS.map(([value, label, mark]) => (
              <button
                key={value}
                aria-pressed={mood?.content.kind === "mood" && mood.content.mood === value}
                onClick={() => void setMood(value)}
              >
                <span aria-hidden="true">{mark}</span>
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.reflectionCard}>
          <div>
            <p className={styles.sectionMark}>
              {phase === "morning" ? "Morning check-in" : "Evening wrap-up"}
            </p>
            <h2>
              {reflection?.completedAt
                ? "Done for now."
                : phase === "morning"
                  ? "Got a minute?"
                  : "Want to wrap this one up?"}
            </h2>
            <p>
              {reflection?.completedAt
                ? "Your answers are tucked into today."
                : "A few easy questions. Skip any. Leave whenever."}
            </p>
          </div>
          <Link
            href={`/reflection/${phase === "morning" ? "morning" : "evening"}?date=${context.localDate}`}
          >
            {reflection ? "Open it again" : "Sure, why not"}
          </Link>
          {reflection?.completedAt ? (
            <span className={styles.stamp}>noted · {context.localDate}</span>
          ) : null}
        </section>

        <section className={styles.timeline} aria-labelledby="timeline-title">
          <div className={styles.timelineHeading}>
            <div>
              <p className={styles.sectionMark}>The day so far</p>
              <h2 id="timeline-title">Stuff that happened</h2>
            </div>
            <span>
              {contentMoments.length
                ? `${contentMoments.length} ${contentMoments.length === 1 ? "thing" : "things"}`
                : "no pressure"}
            </span>
          </div>
          {!ready ? (
            <p className={styles.empty}>Opening your page…</p>
          ) : contentMoments.length === 0 ? (
            <div className={styles.empty}>
              <strong>Nothing here yet. Totally legal.</strong>
              <p>{"Add one line, a photo, a whole journal entry—or don't."}</p>
              <button onClick={() => setCaptureOpen(true)}>Add the first thing</button>
            </div>
          ) : (
            <ol className={styles.moments}>
              {contentMoments.map((moment) => {
                const time = new Intl.DateTimeFormat(undefined, {
                  hour: "numeric",
                  minute: "2-digit",
                }).format(new Date(moment.occurredAt));
                if (moment.content.kind === "text")
                  return (
                    <li key={moment.id} className={styles.note}>
                      <time>{time}</time>
                      <p>{moment.content.text}</p>
                      <button
                        onClick={() => void remove("moment", moment.id)}
                        aria-label="Delete this note"
                      >
                        Remove
                      </button>
                    </li>
                  );
                if (moment.content.kind === "photo") {
                  const media = mediaById.get(moment.content.mediaId);
                  return (
                    <li key={moment.id} className={styles.photo}>
                      <time>{time}</time>
                      {media?.blob ? (
                        <Photo blob={media.blob} alt={media.caption || "Photo from today"} />
                      ) : (
                        <div className={styles.missingPhoto}>Photo unavailable on this device</div>
                      )}{" "}
                      {media?.caption ? <p>{media.caption}</p> : null}
                      <small>
                        {media?.status === "failed"
                          ? "Upload waiting · local copy safe"
                          : "Saved privately here"}
                      </small>
                      <button
                        onClick={() => media && void removePhoto(moment.id, media.id)}
                        aria-label="Delete this photo"
                      >
                        Remove
                      </button>
                    </li>
                  );
                }
                if (moment.content.kind === "journal") {
                  const entry = journalsById.get(moment.content.journalEntryId);
                  if (!entry) return null;
                  return (
                    <li key={moment.id} className={styles.journal}>
                      <time>{time}</time>
                      <p className={styles.sectionMark}>Journal page</p>
                      <h3>{entry.title || "Untitled, which is fine"}</h3>
                      <p>
                        {entry.body
                          ? `${entry.body.slice(0, 180)}${entry.body.length > 180 ? "…" : ""}`
                          : "A blank page, ready when you are."}
                      </p>
                      <Link href={`/journal/${entry.id}`}>
                        {entry.body ? "Read / edit" : "Start writing"}
                      </Link>
                    </li>
                  );
                }
                if (moment.content.kind === "doodle") {
                  const doodle = doodlesById.get(moment.content.doodleId);
                  if (!doodle) return null;
                  return (
                    <li key={moment.id} className={styles.doodle}>
                      <time>{time}</time>
                      <p className={styles.sectionMark}>Doodle pad</p>
                      {doodle.previewDataUrl ? (
                        // Generated locally from structured strokes; never sent to an optimizer.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={doodle.previewDataUrl}
                          alt={doodle.description || doodle.title || "Saved doodle"}
                        />
                      ) : null}
                      <h3>{doodle.title || "Untitled doodle"}</h3>
                      <Link href={`/my-world/doodles/${doodle.id}`}>Open sketchbook</Link>
                    </li>
                  );
                }
                return null;
              })}
            </ol>
          )}
        </section>
        <PinnedTrackers
          userId={LOCAL_FOUNDATION_USER_ID}
          {...context}
          onSaved={async () => {
            setStatus("Tracker noted. No points awarded.");
            await load();
          }}
        />
        <p className={styles.status} role="status" aria-live="polite">
          {status}
        </p>
      </article>
      <QuickCapture
        open={captureOpen}
        onClose={() => {
          setCaptureOpen(false);
          history.replaceState(null, "", location.pathname);
        }}
        onSaved={async (message) => {
          setStatus(message);
          await load();
        }}
        repository={repository}
        userId={LOCAL_FOUNDATION_USER_ID}
        {...context}
      />
    </div>
  );
}

function Photo({ blob, alt }: { blob: Blob; alt: string }) {
  const source = useMemo(() => URL.createObjectURL(blob), [blob]);
  useEffect(() => {
    return () => URL.revokeObjectURL(source);
  }, [source]);
  // IndexedDB object URLs are local-only and cannot use the remote Next image optimizer.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={source} alt={alt} loading="lazy" decoding="async" />;
}
