"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { NetworkStatus } from "./network-status";
import styles from "./app-shell.module.css";

const destinations = [
  ["Today", "/today"],
  ["Calendar", "/calendar"],
  ["Journal", "/journal"],
  ["My World", "/my-world"],
  ["Me", "/me"],
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <>
      <a className={styles.skipLink} href="#main-content">
        Skip to main content
      </a>
      <div className={styles.shell}>
        <aside className={styles.rail}>
          <Link className={styles.brand} href="/today">
            Campus Atelier
            <small>private journal</small>
          </Link>
          <nav className={styles.nav} aria-label="Primary">
            {destinations.map(([label, href]) => (
              <Link
                key={href}
                className={`${styles.navLink} ${pathname.startsWith(href) ? styles.navLinkActive : ""}`}
                href={href}
                aria-current={pathname.startsWith(href) ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>
          <Link className={styles.add} href="/today#quick-capture">
            + Add to Today
          </Link>
          <div className={styles.statusArea}>
            <NetworkStatus />
            <div className={styles.status}>Remote sync not configured</div>
          </div>
        </aside>
        <main className={styles.content} id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </>
  );
}
