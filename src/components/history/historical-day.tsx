"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LocalDateSchema } from "@/domain/shared";
import type { Moment } from "@/domain/moment";
import type { DayWithMoments } from "@/infrastructure/local/journal-repository";
import { LocalJournalRepository } from "@/infrastructure/local/journal-repository";
import { getApplicationDatabase } from "@/infrastructure/local/database";
import { LOCAL_FOUNDATION_USER_ID, readableDate } from "@/lib/journal-session";
import { QuickCapture } from "@/components/today/quick-capture";
import styles from "./historical-day.module.css";

const empty: DayWithMoments = { day: null, moments: [], journals: [], media: [], reflections: [] };

export function HistoricalDay() {
  const params = useParams<{ date: string }>();
  const router = useRouter();
  const parsed = LocalDateSchema.safeParse(params.date);
  const localDate = parsed.success ? parsed.data : null;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const repository = useMemo(() => new LocalJournalRepository(getApplicationDatabase()), []);
  const [bundle, setBundle] = useState(empty);
  const [capture, setCapture] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("Finding that Day…");
  const load = useCallback(async () => {
    if (!localDate) return;
    setBundle(await repository.getDay(LOCAL_FOUNDATION_USER_ID, localDate));
    setStatus("Read-first view · you can still change things.");
  }, [localDate, repository]);
  useEffect(() => {
    if (!localDate) return;
    const task = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(task);
  }, [load, localDate]);
  async function saveText(id: string) {
    if (!draft.trim()) return;
    await repository.updateTextMoment(id, draft);
    setEditing(null);
    setStatus("Updated. It still belongs to this Day.");
    await load();
  }
  async function remove(type: "moment" | "journal_entry", id: string) {
    if (!confirm("Delete this from the Day? The deletion will sync later too.")) return;
    await repository.deleteEntity(type, id);
    await load();
  }
  async function removePhoto(momentId: string, mediaId: string) {
    if (!confirm("Delete this photo from the Day? The deletion will sync later too.")) return;
    await repository.deletePhotoMoment(momentId, mediaId);
    await load();
  }
  if (!localDate)
    return (
      <div className={styles.notebook}>
        <h1>That date got a little weird.</h1>
        <Link href="/today">Back to Today</Link>
      </div>
    );
  const media = new Map(bundle.media.map((item) => [item.id, item]));
  const journals = new Map(bundle.journals.map((item) => [item.id, item]));
  const mood = bundle.moments.find((item) => item.content.kind === "mood");
  return (
    <div className={styles.desk}>
      <article className={styles.notebook}>
        <header>
          <div>
            <p>Filed Day · {localDate}</p>
            <h1>{readableDate(localDate)}</h1>
            <span>
              {bundle.moments.length
                ? "Yep, something lives here."
                : "Quiet page. Still a real Day."}
            </span>
            {mood?.content.kind === "mood" ? <strong>Felt {mood.content.mood}</strong> : null}
          </div>
          <div>
            <button onClick={() => setCapture(true)}>+ Add a memory</button>
            <button onClick={() => router.push("/calendar")}>Calendar</button>
          </div>
        </header>
        <section aria-labelledby="day-pieces">
          <h2 id="day-pieces">What was here</h2>
          {bundle.moments.filter((item) => item.content.kind !== "mood").length === 0 ? (
            <div className={styles.empty}>
              <p>Nothing written down for this one.</p>
              <button onClick={() => setCapture(true)}>Backfill something</button>
            </div>
          ) : (
            <ol>
              {bundle.moments
                .filter((item) => item.content.kind !== "mood")
                .map((moment) => (
                  <li key={moment.id}>
                    <time>
                      {new Intl.DateTimeFormat(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      }).format(new Date(moment.occurredAt))}
                    </time>
                    {moment.content.kind === "text" ? (
                      editing === moment.id ? (
                        <div className={styles.edit}>
                          <textarea
                            aria-label="Edit this memory"
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            autoFocus
                          />
                          <button onClick={() => void saveText(moment.id)}>Save change</button>
                          <button onClick={() => setEditing(null)}>Cancel</button>
                        </div>
                      ) : (
                        <div>
                          <p>{moment.content.text}</p>
                          <div className={styles.controls}>
                            <button
                              onClick={() => {
                                setEditing(moment.id);
                                setDraft(moment.content.kind === "text" ? moment.content.text : "");
                              }}
                            >
                              Edit
                            </button>
                            <button onClick={() => void remove("moment", moment.id)}>Delete</button>
                          </div>
                        </div>
                      )
                    ) : null}
                    {moment.content.kind === "photo" ? (
                      <div>
                        {media.get(moment.content.mediaId)?.blob ? (
                          <HistoricalPhoto
                            blob={media.get(moment.content.mediaId)!.blob!}
                            alt={
                              media.get(moment.content.mediaId)?.caption || "Photo from this Day"
                            }
                          />
                        ) : (
                          <p>{"Photo isn't available on this device."}</p>
                        )}
                        <p>{media.get(moment.content.mediaId)?.caption}</p>
                        <small>
                          Added {new Intl.DateTimeFormat().format(new Date(moment.createdAt))}
                        </small>
                        <div className={styles.controls}>
                          <button onClick={() => void removePhoto(moment.id, photoMediaId(moment))}>
                            Delete photo
                          </button>
                        </div>
                      </div>
                    ) : null}
                    {moment.content.kind === "journal" ? (
                      <div>
                        {journals.get(moment.content.journalEntryId) ? (
                          <>
                            <h3>
                              {journals.get(moment.content.journalEntryId)?.title ||
                                "Untitled journal page"}
                            </h3>
                            <p>
                              {journals.get(moment.content.journalEntryId)?.body.slice(0, 240) ||
                                "Blank page."}
                            </p>
                            <Link href={`/journal/${moment.content.journalEntryId}`}>
                              Read / edit
                            </Link>
                          </>
                        ) : (
                          <p>This journal page was deleted.</p>
                        )}
                      </div>
                    ) : null}
                  </li>
                ))}
            </ol>
          )}
        </section>
        {bundle.reflections.length ? (
          <section className={styles.reflections}>
            <h2>Check-ins from this Day</h2>
            {bundle.reflections.map((item) => (
              <div key={item.id}>
                <strong>
                  {item.period === "morning" ? "Morning check-in" : "Evening wrap-up"}
                </strong>
                <span>
                  {item.answers.filter((answer) => !answer.skipped && answer.answer).length} answers
                </span>
                <Link href={`/reflection/${item.period}?date=${localDate}`}>Open</Link>
              </div>
            ))}
          </section>
        ) : null}
        <footer role="status">{status}</footer>
      </article>
      <QuickCapture
        open={capture}
        onClose={() => setCapture(false)}
        onSaved={async (message) => {
          setStatus(message);
          await load();
        }}
        repository={repository}
        userId={LOCAL_FOUNDATION_USER_ID}
        localDate={localDate}
        timeZone={timeZone}
      />
    </div>
  );
}

function HistoricalPhoto({ blob, alt }: { blob: Blob; alt: string }) {
  const src = useMemo(() => URL.createObjectURL(blob), [blob]);
  useEffect(() => {
    return () => URL.revokeObjectURL(src);
  }, [src]);
  // IndexedDB object URLs are local-only and cannot use the remote Next image optimizer.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} />;
}

function photoMediaId(moment: Moment): string {
  if (moment.content.kind !== "photo") throw new Error("Expected a photo Moment");
  return moment.content.mediaId;
}
