"use client";

import { useEffect, useState } from "react";
import styles from "./pwa.module.css";

export function PwaManager() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [reloading, setReloading] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    let active = true;
    let refreshing = false;
    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).then((registration) => {
      if (!active) return;
      if (registration.waiting) setWaiting(registration.waiting);
      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        installing?.addEventListener("statechange", () => {
          if (installing.state === "installed" && navigator.serviceWorker.controller)
            setWaiting(installing);
        });
      });
    });
    const changed = () => {
      if (refreshing) window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", changed);
    const saveReady = () => {
      refreshing = true;
    };
    window.addEventListener("campus-atelier:update-ready-to-reload", saveReady);
    return () => {
      active = false;
      navigator.serviceWorker.removeEventListener("controllerchange", changed);
      window.removeEventListener("campus-atelier:update-ready-to-reload", saveReady);
    };
  }, []);

  if (!waiting) return null;
  return (
    <aside className={styles.update} role="status" aria-live="polite">
      <div>
        <b>A fresh notebook page is ready.</b>
        <span>Finish typing, then update when it suits you.</span>
      </div>
      <button
        disabled={reloading}
        onClick={() => {
          setReloading(true);
          window.dispatchEvent(new Event("campus-atelier:flush-drafts"));
          let applied = false;
          const apply = () => {
            if (applied) return;
            applied = true;
            window.dispatchEvent(new Event("campus-atelier:update-ready-to-reload"));
            waiting.postMessage({ type: "SKIP_WAITING" });
          };
          window.addEventListener("campus-atelier:drafts-flushed", apply, { once: true });
          window.setTimeout(apply, 900);
        }}
      >
        {reloading ? "Updating…" : "Update safely"}
      </button>
      <button aria-label="Dismiss update notice" onClick={() => setWaiting(null)}>
        Later
      </button>
    </aside>
  );
}
