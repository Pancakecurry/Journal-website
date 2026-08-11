"use client";

import { useEffect, useState } from "react";
import styles from "./app-shell.module.css";

export function NetworkStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <div className={styles.status} role="status" aria-live="polite">
      <span
        className={`${styles.statusDot} ${online ? "" : styles.statusDotOffline}`}
        aria-hidden="true"
      />
      {online ? "Online · local writes ready" : "Offline · saved on this device"}
    </div>
  );
}
