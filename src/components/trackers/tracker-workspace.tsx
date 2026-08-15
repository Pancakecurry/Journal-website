"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  TRACKER_TYPES,
  type TrackerDefinition,
  type TrackerEntry,
  type TrackerType,
  type TrackerValue,
} from "@/domain/history";
import { LocalDateSchema } from "@/domain/shared";
import { getApplicationDatabase } from "@/infrastructure/local/database";
import { LocalHistoryRepository } from "@/infrastructure/local/history-repository";
import { currentDayContext, LOCAL_FOUNDATION_USER_ID, readableDate } from "@/lib/journal-session";
import styles from "./trackers.module.css";

const LABELS: Record<TrackerType, string> = {
  yes_no: "Yes / no",
  count: "Count",
  number: "Number",
  scale: "1-5 scale",
  duration: "Duration (minutes)",
  short_text: "Short text",
  single_select: "One choice",
};
export function TrackerIndex() {
  const repository = useMemo(() => new LocalHistoryRepository(getApplicationDatabase()), []);
  const [trackers, setTrackers] = useState<TrackerDefinition[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<TrackerType>("yes_no");
  const [options, setOptions] = useState("");
  const load = useCallback(
    async () => setTrackers(await repository.trackers(LOCAL_FOUNDATION_USER_ID)),
    [repository],
  );
  useEffect(() => {
    let alive = true;
    void repository.trackers(LOCAL_FOUNDATION_USER_ID).then((rows) => {
      if (alive) setTrackers(rows);
    });
    return () => {
      alive = false;
    };
  }, [repository]);
  async function create() {
    await repository.createTracker({
      userId: LOCAL_FOUNDATION_USER_ID,
      name,
      type,
      options: options.split(","),
      pinned: (trackers?.filter((item) => item.pinned).length ?? 0) < 3,
    });
    setName("");
    setCreating(false);
    await load();
  }
  return (
    <section className={styles.notebook}>
      <header>
        <p>Trackers · notebook</p>
        <h1>Keep tabs on whatever.</h1>
        <span>Coffee, headaches, movies, good hair days. Your life, your labels.</span>
        <button onClick={() => setCreating(!creating)}>
          {creating ? "Never mind" : "+ New tracker"}
        </button>
      </header>
      {creating ? (
        <div className={styles.form}>
          <label>
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Called home"
            />
          </label>
          <label>
            Kind
            <select value={type} onChange={(e) => setType(e.target.value as TrackerType)}>
              {TRACKER_TYPES.map((value) => (
                <option key={value} value={value}>
                  {LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          {type === "single_select" ? (
            <label>
              Choices
              <input
                value={options}
                onChange={(e) => setOptions(e.target.value)}
                placeholder="Tea, coffee, chaos"
              />
            </label>
          ) : null}
          <button disabled={!name.trim()} onClick={() => void create()}>
            Make tracker
          </button>
        </div>
      ) : null}
      {trackers === null ? (
        <p>Opening the divider…</p>
      ) : trackers.length === 0 ? (
        <div className={styles.empty}>
          <h2>Nothing tracked. Also fine.</h2>
          <p>Make one when curiosity strikes, not because an app told you to.</p>
        </div>
      ) : (
        <ol className={styles.list}>
          {trackers.map((item) => (
            <li key={item.id}>
              <div>
                <span>{LABELS[item.type]}</span>
                <h2>
                  <Link href={`/me/trackers/${item.id}`}>{item.name}</Link>
                </h2>
                <p>{item.description || "No grand theory attached."}</p>
              </div>
              <button
                onClick={async () => {
                  await repository.updateTracker(item.id, { pinned: !item.pinned });
                  await load();
                }}
                aria-pressed={item.pinned}
              >
                {item.pinned ? "On Today" : "Pin to Today"}
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function TrackerDetail({ id }: { id: string }) {
  const repository = useMemo(() => new LocalHistoryRepository(getApplicationDatabase()), []);
  const router = useRouter();
  const today = useMemo(() => currentDayContext(), []);
  const [tracker, setTracker] = useState<TrackerDefinition | null | undefined>(undefined);
  const [entries, setEntries] = useState<TrackerEntry[]>([]);
  const [value, setValue] = useState<TrackerValue>("");
  const [date, setDate] = useState(today.localDate);
  const [note, setNote] = useState("");
  const load = useCallback(async () => {
    const { item, rows } = await loadTracker(repository, id, date);
    setTracker(item);
    setEntries(rows);
  }, [date, id, repository]);
  useEffect(() => {
    let alive = true;
    void loadTracker(repository, id, date).then(({ item, rows }) => {
      if (!alive) return;
      setTracker(item);
      setEntries(rows);
    });
    return () => {
      alive = false;
    };
  }, [date, id, repository]);
  if (tracker === undefined) return <section className={styles.notebook}>Opening tracker…</section>;
  if (!tracker)
    return (
      <section className={styles.notebook}>
        <h1>That tracker wandered off.</h1>
        <Link href="/me/trackers">Back to trackers</Link>
      </section>
    );
  async function save() {
    const parsed = LocalDateSchema.parse(date);
    await repository.saveTrackerEntry({
      userId: LOCAL_FOUNDATION_USER_ID,
      trackerId: id,
      localDate: parsed,
      timeZone: today.timeZone,
      value: coerce(tracker!, value),
      note,
    });
    setNote("");
    await load();
  }
  return (
    <section className={styles.notebook}>
      <header>
        <p>Tracker · {LABELS[tracker.type]}</p>
        <h1>{tracker.name}</h1>
        <span>{tracker.description || "Just the facts you chose to keep."}</span>
        <Link href="/me/trackers">All trackers</Link>
      </header>
      <div className={styles.entryForm}>
        <label>
          Day
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(LocalDateSchema.parse(e.target.value))}
          />
        </label>
        <ValueField tracker={tracker} value={value} onChange={setValue} />
        <label>
          Small note (optional)
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <button onClick={() => void save()}>Put it on this Day</button>
      </div>
      <section className={styles.history}>
        <h2>
          {new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(
            new Date(`${date.slice(0, 7)}-01T12:00:00`),
          )}
        </h2>
        <p>{summary(tracker, entries)}</p>
        {entries.length ? (
          <ol>
            {entries.map((entry) => (
              <li key={entry.id}>
                <time>{readableDate(entry.localDate, { month: "short", day: "numeric" })}</time>
                <span
                  style={
                    {
                      "--amount":
                        typeof entry.value === "number"
                          ? Math.min(100, Math.max(6, entry.value * 10))
                          : 35,
                    } as React.CSSProperties
                  }
                />
                <strong>{formatValue(tracker, entry.value)}</strong>
                {entry.note ? <small>{entry.note}</small> : null}
              </li>
            ))}
          </ol>
        ) : (
          <div className={styles.empty}>No entries in this bit of the notebook.</div>
        )}
      </section>
      <button
        className={styles.archive}
        onClick={async () => {
          await repository.updateTracker(id, { archived: !tracker.archivedAt });
          router.push("/me/trackers");
        }}
      >
        {tracker.archivedAt ? "Unarchive tracker" : "Archive tracker"}
      </button>
    </section>
  );
}

async function loadTracker(repository: LocalHistoryRepository, id: string, date: string) {
  const item =
    (await repository.trackers(LOCAL_FOUNDATION_USER_ID, true)).find((row) => row.id === id) ??
    null;
  if (!item) return { item, rows: [] as TrackerEntry[] };
  const start = `${date.slice(0, 7)}-01` as TrackerEntry["localDate"];
  const monthStart = new Date(`${start}T12:00:00Z`);
  const end =
    `${date.slice(0, 7)}-${String(new Date(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0).getDate()).padStart(2, "0")}` as TrackerEntry["localDate"];
  const rows = await repository.trackerEntries(LOCAL_FOUNDATION_USER_ID, id, start, end);
  return { item, rows };
}
function ValueField({
  tracker,
  value,
  onChange,
}: {
  tracker: TrackerDefinition;
  value: TrackerValue;
  onChange: (value: TrackerValue) => void;
}) {
  if (tracker.type === "yes_no")
    return (
      <label>
        Value
        <select value={String(value)} onChange={(e) => onChange(e.target.value === "true")}>
          <option value="">Choose</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      </label>
    );
  if (tracker.type === "single_select")
    return (
      <label>
        Value
        <select value={String(value)} onChange={(e) => onChange(e.target.value)}>
          <option value="">Choose</option>
          {tracker.options.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>
    );
  if (tracker.type === "scale")
    return (
      <label>
        Value
        <select value={String(value)} onChange={(e) => onChange(Number(e.target.value))}>
          <option value="">Choose</option>
          {[1, 2, 3, 4, 5].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>
    );
  return (
    <label>
      Value
      <input
        type={["count", "number", "duration"].includes(tracker.type) ? "number" : "text"}
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
function coerce(tracker: TrackerDefinition, value: TrackerValue) {
  if (["count", "number", "scale", "duration"].includes(tracker.type)) return Number(value);
  return value;
}
function formatValue(tracker: TrackerDefinition, value: TrackerValue) {
  if (tracker.type === "yes_no") return value ? "Yes" : "No";
  return `${value}${tracker.unit ? ` ${tracker.unit}` : tracker.type === "duration" ? " min" : ""}`;
}
function summary(tracker: TrackerDefinition, entries: TrackerEntry[]) {
  if (!entries.length) return "No entries yet. Nothing to diagnose.";
  const nums = entries
    .map((item) => item.value)
    .filter((value): value is number => typeof value === "number");
  return nums.length
    ? `${entries.length} entries. Average ${Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10}${tracker.unit ? ` ${tracker.unit}` : ""}.`
    : `${entries.length} entries in this visible month.`;
}
