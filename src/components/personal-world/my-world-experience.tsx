"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ResurfacedMemory, WorldSummary } from "@/domain/personal-world";
import type { UserPreferences } from "@/domain/preferences";
import { getApplicationDatabase } from "@/infrastructure/local/database";
import { LocalPersonalWorldRepository } from "@/infrastructure/local/personal-world-repository";
import { currentDayContext, LOCAL_FOUNDATION_USER_ID, readableDate } from "@/lib/journal-session";
import styles from "./personal-world.module.css";

export function MyWorldExperience() {
  const repository = useMemo(() => new LocalPersonalWorldRepository(getApplicationDatabase()), []);
  const [summary, setSummary] = useState<WorldSummary>();
  const [preferences, setPreferences] = useState<UserPreferences>();
  const [memory, setMemory] = useState<ResurfacedMemory | null>();
  const [status, setStatus] = useState("Putting the desk back how you left it…");
  const today = useMemo(() => currentDayContext().localDate, []);
  useEffect(() => {
    let alive = true;
    void Promise.all([
      repository.summary(LOCAL_FOUNDATION_USER_ID),
      repository.preferences(LOCAL_FOUNDATION_USER_ID),
      repository.memoryForDay(LOCAL_FOUNDATION_USER_ID, today),
    ]).then(([nextSummary, nextPreferences, nextMemory]) => {
      if (!alive) return;
      setSummary(nextSummary);
      setPreferences(nextPreferences);
      setMemory(nextMemory);
      setStatus("Your things, where you left them.");
    });
    return () => {
      alive = false;
    };
  }, [repository, today]);
  if (!summary || !preferences) return <main className={styles.worldLoading}>{status}</main>;
  const inhabited = summary.dayCount > 0 || summary.doodleCount > 0 || summary.keepsakeCount > 0;
  return (
    <main className={styles.world} data-cover={preferences.notebookCover}>
      <header>
        <p>My World · your desk</p>
        <h1>{inhabited ? "Looks like you live here." : "All set. No fake memories included."}</h1>
        <span>
          {inhabited
            ? "The useful bits showed up because you actually made them."
            : "A notebook, a pen, and plenty of room. That's enough for day one."}
        </span>
        <Link href="/me/personalization">Choose stationery</Link>
      </header>
      <section className={styles.deskScene} aria-label="Your accumulated journal objects">
        <Link className={styles.notebookObject} href="/calendar">
          <small>
            {summary.dayCount
              ? `${summary.dayCount} ${summary.dayCount === 1 ? "Day" : "Days"}`
              : "Fresh notebook"}
          </small>
          <strong>Daily pages</strong>
          <span>
            {summary.completedMonthCount
              ? `${summary.completedMonthCount} finished month notes`
              : "Ready when something happens"}
          </span>
        </Link>
        <span className={styles.pen} aria-hidden="true" />
        {summary.photoCount ? (
          <Link className={styles.photoBox} href="/search">
            <strong>Photo box</strong>
            <span>
              {summary.photoCount} local {summary.photoCount === 1 ? "photo" : "photos"}
            </span>
          </Link>
        ) : null}
        {summary.keepsakeCount ? (
          <Link className={styles.keepsakeTray} href="/my-world/keepsakes">
            <strong>Things worth keeping</strong>
            <span>{summary.keepsakeCount} tucked away</span>
          </Link>
        ) : null}
        {summary.trackerCount ? (
          <Link className={styles.trackerBook} href="/me/trackers">
            <strong>Odd little logs</strong>
            <span>{summary.trackerCount} active</span>
          </Link>
        ) : null}
        <Link className={styles.doodlePad} href="/my-world/doodles">
          <strong>Sketchbook</strong>
          <span>
            {summary.doodleCount
              ? `${summary.doodleCount} doodles inside`
              : "Blank paper. Very powerful."}
          </span>
        </Link>
        <Link className={styles.gameDrawer} href="/my-world/games">
          <strong>Desk-break drawer</strong>
          <span>Two tiny games. No points economy.</span>
        </Link>
      </section>
      {memory !== undefined ? (
        memory ? (
          <MemoryCard
            memory={memory}
            onHide={async (scope) => {
              await repository.hideMemory(LOCAL_FOUNDATION_USER_ID, memory, scope);
              setMemory(null);
              setStatus(
                scope === "day"
                  ? "Nothing from that Day will pop up here."
                  : "That one will stay put.",
              );
            }}
          />
        ) : (
          <section className={styles.noMemory}>
            <p>Nothing from this date is asking for attention.</p>
          </section>
        )
      ) : null}
      <p className={styles.worldStatus} role="status">
        {status}
      </p>
    </main>
  );
}

function MemoryCard({
  memory,
  onHide,
}: {
  memory: ResurfacedMemory;
  onHide(scope: "item" | "day"): Promise<void>;
}) {
  const [photoUrl, setPhotoUrl] = useState<string>();
  useEffect(() => {
    if (!memory.previewBlob) return;
    const url = URL.createObjectURL(memory.previewBlob);
    const task = window.setTimeout(() => setPhotoUrl(url), 0);
    return () => {
      window.clearTimeout(task);
      URL.revokeObjectURL(url);
    };
  }, [memory.previewBlob]);
  const href =
    memory.entityType === "journal"
      ? `/journal/${memory.entityId}`
      : memory.entityType === "doodle"
        ? `/my-world/doodles/${memory.entityId}`
        : `/day/${memory.localDate}`;
  return (
    <section className={styles.memoryCard} aria-labelledby="memory-heading">
      <div>
        <p>
          From this date ·{" "}
          {readableDate(memory.localDate, { month: "short", day: "numeric", year: "numeric" })}
        </p>
        <h2 id="memory-heading">{memory.title}</h2>
        {photoUrl ? (
          // Local object URL; no remote request or image optimizer.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={memory.preview} />
        ) : memory.previewDataUrl ? (
          // Local generated doodle preview.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={memory.previewDataUrl} alt={memory.preview || memory.title} />
        ) : null}
        <blockquote>{memory.preview}</blockquote>
        <Link href={href}>Open the original</Link>
      </div>
      <div className={styles.memoryControls}>
        <button onClick={() => void onHide("item")}>{"Don't show this one again"}</button>
        <button onClick={() => void onHide("day")}>{"Don't show memories from this Day"}</button>
      </div>
    </section>
  );
}
