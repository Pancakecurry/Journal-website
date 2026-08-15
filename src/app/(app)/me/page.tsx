import type { Metadata } from "next";
import Link from "next/link";
import styles from "./me.module.css";
export const metadata: Metadata = { title: "Me" };

const drawers = [
  {
    href: "/me/personalization",
    mark: "A",
    title: "Personalization",
    detail: "Paper, cover, color, motion, and how lived-in the desk gets.",
    tone: "accent",
  },
  {
    href: "/me/privacy",
    mark: "P",
    title: "Privacy & AI",
    detail: "AI is off by default. Choose exactly what it may read—or leave it alone.",
    tone: "ink",
  },
  {
    href: "/me/export",
    mark: "E",
    title: "Export my journal",
    detail: "Take a readable copy, structured data, photos, and doodles with you.",
    tone: "paper",
  },
  {
    href: "/me/import",
    mark: "R",
    title: "Restore an archive",
    detail: "Inspect a Campus Atelier backup, then bring it back without silent overwrites.",
    tone: "paper",
  },
  {
    href: "/me/trackers",
    mark: "T",
    title: "Trackers",
    detail: "The odd little things you care about. No scores, no nagging.",
    tone: "sage",
  },
  {
    href: "/me/install",
    mark: "I",
    title: "Install the journal",
    detail: "Keep it on this device and understand offline startup.",
    tone: "accent",
  },
  {
    href: "/me/storage",
    mark: "S",
    title: "Storage on this device",
    detail: "Local space, photos, persistence, and what the browser can promise.",
    tone: "sage",
  },
  {
    href: "/me/data",
    mark: "D",
    title: "Data controls",
    detail: "See the deletion path before you ever need it.",
    tone: "quiet",
  },
] as const;

export default function MePage() {
  return (
    <main className={styles.mePage}>
      <header>
        <div>
          <p>Me · notebook cabinet</p>
          <h1>Your journal, on your terms.</h1>
        </div>
        <aside>
          <span>PRIVATE</span>
          <p>Understandable controls. No mystery switches hiding behind a legal essay.</p>
        </aside>
      </header>
      <section className={styles.cabinet} aria-label="Journal preferences and controls">
        <div className={styles.cabinetLabel}>
          <span>CAMPUS ATELIER</span>
          <b>Personal cabinet</b>
          <small>Filed by you</small>
        </div>
        <div className={styles.drawers}>
          {drawers.map((item, index) => (
            <Link href={item.href} key={item.href} data-tone={item.tone}>
              <span className={styles.index}>{String(index + 1).padStart(2, "0")}</span>
              <i aria-hidden="true">{item.mark}</i>
              <div>
                <h2>{item.title}</h2>
                <p>{item.detail}</p>
              </div>
              <b aria-hidden="true">→</b>
            </Link>
          ))}
        </div>
      </section>
      <footer>
        <span>A quiet journal is still a complete journal.</span>
        <Link href="/today">Back to Today</Link>
      </footer>
    </main>
  );
}
