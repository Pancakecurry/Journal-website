"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { motion } from "motion/react";
import { NetworkStatus } from "./network-status";
import { SessionControl } from "@/components/auth/session-control";
import { PwaManager } from "@/components/pwa/pwa-manager";
import { SyncCoordinator } from "./sync-coordinator";
import { WelcomeBack } from "./welcome-back";
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
      <PwaManager />
      <WelcomeBack />
      <a className={styles.skipLink} href="#main-content">
        Skip to main content
      </a>
      <div className={styles.shell}>
        <aside className={styles.rail}>
          <Link className={styles.brand} href="/today">
            <span>CA</span>
            <b>Campus Atelier</b>
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
                <span>{label}</span>
                {pathname.startsWith(href) ? (
                  <motion.i
                    layoutId="active-divider"
                    transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
                  />
                ) : null}
              </Link>
            ))}
          </nav>
          {pathname.startsWith("/journal/") || pathname.startsWith("/reflection/") ? null : (
            <Link className={styles.search} href="/search" aria-label="Search your journal">
              <span aria-hidden="true">⌕</span> <b>Find something</b>
            </Link>
          )}
          <a className={styles.add} href="/today#quick-capture">
            + Add to Today
          </a>
          <div className={styles.statusArea}>
            <NetworkStatus />
            <SyncCoordinator />
            <SessionControl />
          </div>
        </aside>
        <motion.main
          key={pathname}
          className={styles.content}
          id="main-content"
          tabIndex={-1}
          initial={{ y: 14, scale: 0.998 }}
          animate={{ y: 0, scale: 1 }}
          transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.main>
      </div>
    </>
  );
}
