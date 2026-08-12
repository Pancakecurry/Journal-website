"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { TrackerDefinition, TrackerValue } from "@/domain/history";
import type { LocalDate } from "@/domain/shared";
import { getApplicationDatabase } from "@/infrastructure/local/database";
import { LocalHistoryRepository } from "@/infrastructure/local/history-repository";
import styles from "./trackers.module.css";
export function PinnedTrackers({
  userId,
  localDate,
  timeZone,
  onSaved,
}: {
  userId: string;
  localDate: LocalDate;
  timeZone: string;
  onSaved(): Promise<void>;
}) {
  const repository = useMemo(() => new LocalHistoryRepository(getApplicationDatabase()), []);
  const [items, setItems] = useState<TrackerDefinition[]>([]);
  const [busy, setBusy] = useState("");
  useEffect(() => {
    void repository
      .trackers(userId)
      .then((rows) => setItems(rows.filter((row) => row.pinned).slice(0, 3)));
  }, [repository, userId]);
  if (!items.length) return null;
  async function save(item: TrackerDefinition, value: TrackerValue) {
    setBusy(item.id);
    await repository.saveTrackerEntry({ userId, trackerId: item.id, localDate, timeZone, value });
    await onSaved();
    setBusy("");
  }
  return (
    <section className={styles.pinned}>
      <div>
        <p>Today’s little trackers</p>
        <h2>Anything to jot down?</h2>
      </div>
      <div>
        {items.map((item) => (
          <article key={item.id}>
            <strong>{item.name}</strong>
            {item.type === "yes_no" ? (
              <div>
                <button disabled={busy === item.id} onClick={() => void save(item, true)}>
                  Yep
                </button>
                <button disabled={busy === item.id} onClick={() => void save(item, false)}>
                  Nope
                </button>
              </div>
            ) : (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const raw = String(new FormData(event.currentTarget).get("value") ?? "");
                  void save(
                    item,
                    ["count", "number", "scale", "duration"].includes(item.type)
                      ? Number(raw)
                      : raw,
                  );
                }}
              >
                <input
                  name="value"
                  aria-label={`Value for ${item.name}`}
                  type={
                    ["count", "number", "scale", "duration"].includes(item.type) ? "number" : "text"
                  }
                  required
                />
                <button disabled={busy === item.id}>Note it</button>
              </form>
            )}
          </article>
        ))}
      </div>
      <Link href="/me/trackers">Tracker notebook</Link>
    </section>
  );
}
