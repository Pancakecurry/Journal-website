"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getApplicationDatabase } from "@/infrastructure/local/database";
import { LOCAL_FOUNDATION_USER_ID } from "@/lib/journal-session";
import styles from "./pwa.module.css";
import Image from "next/image";

interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallCenter() {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [standalone] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches,
  );
  const [message, setMessage] = useState(
    "Install is quiet and optional. The journal works in a normal tab too.",
  );
  useEffect(() => {
    const capture = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", capture);
    return () => window.removeEventListener("beforeinstallprompt", capture);
  }, []);
  const ios = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
  return (
    <main className={styles.page}>
      <header>
        <p>Install · keep it close</p>
        <h1>Your notebook, one tap away.</h1>
        <span>
          After the first online visit, core pages and local writing can open without a connection.
        </span>
      </header>
      <section className={styles.sheet}>
        <div className={styles.iconPreview}>
          <Image src="/icons/atelier.svg" width={128} height={128} alt="Campus Atelier app icon" />
        </div>
        <div>
          <h2>{standalone ? "Already installed here" : "Install Campus Atelier"}</h2>
          <p>
            {ios
              ? "In Safari, tap Share, then Add to Home Screen."
              : prompt
                ? "Your browser is ready to install the app."
                : "Use your browser’s Install app or Add to Home Screen menu when it appears."}
          </p>
        </div>
        {prompt && !standalone ? (
          <button
            onClick={async () => {
              await prompt.prompt();
              const choice = await prompt.userChoice;
              setMessage(
                choice.outcome === "accepted"
                  ? "Installed. Nice and tidy."
                  : "No problem. The browser version is still complete.",
              );
              setPrompt(null);
            }}
          >
            Install on this device
          </button>
        ) : null}
      </section>
      <p role="status">{message}</p>
    </main>
  );
}

export function StorageCenter() {
  const database = useMemo(() => getApplicationDatabase(), []);
  const [status, setStatus] = useState({
    used: 0,
    quota: 0,
    media: 0,
    persistent: false,
    supported: false,
  });
  const [message, setMessage] = useState("Checking what this browser can tell us…");
  const load = useCallback(async () => {
    const estimate = await navigator.storage?.estimate?.();
    const persistent = (await navigator.storage?.persisted?.()) ?? false;
    const media = await database.media.where("userId").equals(LOCAL_FOUNDATION_USER_ID).toArray();
    setStatus({
      used: estimate?.usage ?? 0,
      quota: estimate?.quota ?? 0,
      media: media.reduce((sum, item) => sum + item.byteSize, 0),
      persistent,
      supported: Boolean(navigator.storage),
    });
    setMessage(
      persistent
        ? "This browser granted persistent storage."
        : "Storage can still be cleared by the browser or device. Keep exports for anything irreplaceable.",
    );
  }, [database]);
  useEffect(() => {
    const pending = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(pending);
  }, [load]);
  const percent = status.quota ? Math.min(100, Math.round((status.used / status.quota) * 100)) : 0;
  return (
    <main className={styles.page}>
      <header>
        <p>Storage · this device</p>
        <h1>What’s tucked away here.</h1>
        <span>Plain numbers, no IndexedDB archaeology required.</span>
      </header>
      <section className={styles.storageGrid}>
        <article>
          <small>Local use</small>
          <strong>{formatBytes(status.used)}</strong>
          <span>{percent}% of the browser’s reported allowance</span>
        </article>
        <article>
          <small>Photos</small>
          <strong>{formatBytes(status.media)}</strong>
          <span>Locally available private media</span>
        </article>
        <article>
          <small>Storage protection</small>
          <strong>
            {status.persistent ? "Granted" : status.supported ? "Not granted" : "Unavailable"}
          </strong>
          <span>Browser support varies</span>
        </article>
      </section>
      {!status.persistent && status.supported ? (
        <button
          className={styles.primary}
          onClick={async () => {
            const granted = (await navigator.storage.persist?.()) ?? false;
            await load();
            setMessage(
              granted
                ? "Persistent storage granted for this device."
                : "The browser didn’t grant it. Your journal still works; keep a private export too.",
            );
          }}
        >
          Help protect local storage
        </button>
      ) : null}
      <p role="status">{message}</p>
    </main>
  );
}

function formatBytes(value: number) {
  if (!value) return "0 MB";
  const units = ["B", "KB", "MB", "GB"];
  const order = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** order).toFixed(order > 1 ? 1 : 0)} ${units[order]}`;
}
