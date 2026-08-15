"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { motion } from "motion/react";
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
          {pathname.startsWith("/journal/") || pathname.startsWith("/reflection/") ? null : (
            <Link className={styles.search} href="/search" aria-label="Search your journal">
              <span aria-hidden="true">⌕</span> <b>Search your journal</b>
            </Link>
          )}
          <Link className={styles.add} href="/today#quick-capture">
            + Add to Today
          </Link>
          <div className={styles.statusArea}>
            <NetworkStatus />
            <div className={styles.status}>Remote sync not configured</div>
          </div>
        </aside>
        <motion.main
          key={pathname}
          className={styles.content}
          id="main-content"
          tabIndex={-1}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {children}
        </motion.main>
      </div>
    </>
  );
}
