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
    group: "Make it yours",
  },
  {
    href: "/me/privacy",
    mark: "P",
    title: "Privacy & AI",
    detail: "AI is off by default. Choose exactly what it may read, or leave it alone.",
    tone: "ink",
    group: "Privacy and ownership",
  },
  {
    href: "/me/export",
    mark: "E",
    title: "Export my journal",
    detail: "Take a readable copy, structured data, photos, and doodles with you.",
    tone: "paper",
    group: "Privacy and ownership",
  },
  {
    href: "/me/import",
    mark: "R",
    title: "Restore an archive",
    detail: "Inspect a Campus Atelier backup, then bring it back without silent overwrites.",
    tone: "paper",
    group: "Privacy and ownership",
  },
  {
    href: "/me/trackers",
    mark: "T",
    title: "Trackers",
    detail: "The odd little things you care about. No scores, no nagging.",
    tone: "sage",
    group: "Make it yours",
  },
  {
    href: "/me/install",
    mark: "I",
    title: "Install the journal",
    detail: "Keep it on this device and understand offline startup.",
    tone: "accent",
    group: "On this device",
  },
  {
    href: "/me/storage",
    mark: "S",
    title: "Storage on this device",
    detail: "Local space, photos, persistence, and what the browser can promise.",
    tone: "sage",
    group: "On this device",
  },
  {
    href: "/me/data",
    mark: "D",
    title: "Data controls",
    detail: "See the deletion path before you ever need it.",
    tone: "quiet",
    group: "Privacy and ownership",
  },
] as const;

export default function MePage() {
  const groups = ["Make it yours", "Privacy and ownership", "On this device"] as const;
  return (
    <main className={styles.mePage}>
      <header>
        <div>
          <p>Me</p>
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
          {groups.map((group) => (
            <section className={styles.drawerGroup} key={group}>
              <h2>{group}</h2>
              <div>
                {drawers
                  .filter((item) => item.group === group)
                  .map((item) => (
                    <Link href={item.href} key={item.href} data-tone={item.tone}>
                      <i aria-hidden="true">{item.mark}</i>
                      <span>
                        <strong>{item.title}</strong>
                        <small>{item.detail}</small>
                      </span>
                      <b aria-hidden="true">→</b>
                    </Link>
                  ))}
              </div>
            </section>
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
