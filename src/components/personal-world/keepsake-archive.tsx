"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Keepsake } from "@/domain/personal-world";
import { getApplicationDatabase } from "@/infrastructure/local/database";
import { LocalPersonalWorldRepository } from "@/infrastructure/local/personal-world-repository";
import { LOCAL_FOUNDATION_USER_ID, readableDate } from "@/lib/journal-session";
import styles from "./personal-world.module.css";

export function KeepsakeArchive() {
  const repository = useMemo(() => new LocalPersonalWorldRepository(getApplicationDatabase()), []);
  const [items, setItems] = useState<Keepsake[]>();
  const load = useCallback(
    async () => setItems(await repository.keepsakes(LOCAL_FOUNDATION_USER_ID)),
    [repository],
  );
  useEffect(() => {
    let alive = true;
    void repository.keepsakes(LOCAL_FOUNDATION_USER_ID).then((rows) => {
      if (alive) setItems(rows);
    });
    return () => {
      alive = false;
    };
  }, [repository]);
  return (
    <main className={styles.archive}>
      <header>
        <p>Keepsakes · tucked away</p>
        <h1>The bits you meant to keep handy.</h1>
        <span>No boards. No collecting contest. Just a short way back.</span>
        <Link href="/my-world">Back to your desk</Link>
      </header>
      {items === undefined ? (
        <p>Opening the little drawer…</p>
      ) : items.length === 0 ? (
        <section className={styles.archiveEmpty}>
          <h2>Nothing tucked away yet.</h2>
          <p>On an old Day, use “Keep this” when something deserves an easier route back.</p>
          <Link href="/calendar">Browse the calendar</Link>
        </section>
      ) : (
        <ol className={styles.keepsakeList}>
          {items.map((item) => (
            <li key={item.id}>
              <div>
                <p>
                  {label(item.sourceType)}
                  {item.localDate
                    ? ` · ${readableDate(item.localDate, { month: "short", day: "numeric", year: "numeric" })}`
                    : ""}
                </p>
                <h2>
                  <Link href={hrefFor(item)}>{item.title}</Link>
                </h2>
                <blockquote>
                  {item.preview || "Open the original to see the whole thing."}
                </blockquote>
              </div>
              <button
                onClick={async () => {
                  await repository.removeKeepsake(item.id);
                  await load();
                }}
              >
                Take it out
              </button>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}

function label(type: Keepsake["sourceType"]) {
  return {
    moment: "Moment",
    photo: "Photo",
    journal: "Journal page",
    day: "Day",
    monthly_recap: "Monthly recap",
    monthly_reflection: "Monthly note",
    doodle: "Doodle",
  }[type];
}
function hrefFor(item: Keepsake) {
  if (item.sourceType === "journal") return `/journal/${item.sourceId}`;
  if (item.sourceType === "doodle") return `/my-world/doodles/${item.sourceId}`;
  if (item.month) return `/calendar/${item.month}/recap`;
  return item.localDate ? `/day/${item.localDate}` : "/my-world";
}
