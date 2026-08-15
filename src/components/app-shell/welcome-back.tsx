"use client";
import { useEffect, useState } from "react";
import styles from "./app-shell.module.css";
const KEY = "campus-atelier:last-opened";
export function WelcomeBack() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const pending = window.setTimeout(() => {
      const previous = Number(localStorage.getItem(KEY) ?? 0);
      setShow(Boolean(previous && Date.now() - previous > 14 * 24 * 60 * 60 * 1000));
      localStorage.setItem(KEY, String(Date.now()));
    }, 0);
    return () => window.clearTimeout(pending);
  }, []);
  if (!show) return null;
  return (
    <aside className={styles.welcome} role="status">
      <div>
        <b>Welcome back.</b>
        <span>Your notebook waited. Very professionally.</span>
      </div>
      <button onClick={() => setShow(false)} aria-label="Dismiss welcome back message">
        Okay
      </button>
    </aside>
  );
}
