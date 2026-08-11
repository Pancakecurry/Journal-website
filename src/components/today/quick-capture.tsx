"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { LocalDate } from "@/domain/shared";
import { prepareImage } from "@/infrastructure/media/image-processing";
import type { LocalJournalRepository } from "@/infrastructure/local/journal-repository";
import styles from "./quick-capture.module.css";

interface Props {
  open: boolean;
  onClose(): void;
  onSaved(message: string): Promise<void>;
  repository: LocalJournalRepository;
  userId: string;
  localDate: LocalDate;
  timeZone: string;
}

export function QuickCapture({
  open,
  onClose,
  onSaved,
  repository,
  userId,
  localDate,
  timeZone,
}: Props) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const textInput = useRef<HTMLTextAreaElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [text, setText] = useState("");
  const [caption, setCaption] = useState("");
  const [mode, setMode] = useState<"text" | "photo">("text");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open && !node.open) {
      returnFocus.current = document.activeElement as HTMLElement;
      node.showModal();
      window.setTimeout(() => textInput.current?.focus(), 0);
    } else if (!open && node.open) node.close();
  }, [open]);

  function close() {
    if (busy) return;
    onClose();
    window.setTimeout(() => returnFocus.current?.focus(), 0);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (mode === "text" && !text.trim()) return;
    if (mode === "photo" && !file) return;
    setBusy(true);
    setError("");
    try {
      if (mode === "text") {
        await repository.addTextMoment({ userId, localDate, timeZone, text });
        setText("");
        await onSaved(
          navigator.onLine
            ? "Saved here. Sync can catch up later."
            : "Saved here. No internet needed.",
        );
      } else if (file) {
        const image = await prepareImage(file);
        await repository.addPhoto({ userId, localDate, timeZone, ...image, caption });
        setFile(null);
        setCaption("");
        setMode("text");
        await onSaved("Photo saved on this device.");
      }
      close();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "No luck saving that. Your draft is still here.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function startJournal() {
    setBusy(true);
    try {
      const journal = await repository.createJournal({ userId, localDate, timeZone });
      onClose();
      router.push(`/journal/${journal.id}`);
    } catch {
      setError("Couldn't open a fresh page. Give it another go.");
      setBusy(false);
    }
  }

  return (
    <dialog
      className={styles.dialog}
      ref={dialog}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClose={() => {
        if (open) onClose();
      }}
      aria-labelledby="capture-heading"
    >
      <form className={styles.paper} onSubmit={submit}>
        <div className={styles.topline}>
          <span>Quick add</span>
          <button
            type="button"
            className={styles.close}
            onClick={close}
            aria-label="Close quick capture"
          >
            ×
          </button>
        </div>
        <h2 id="capture-heading">What happened?</h2>
        <div className={styles.types} aria-label="What are you adding?">
          <button type="button" aria-pressed={mode === "text"} onClick={() => setMode("text")}>
            A note
          </button>
          <button type="button" aria-pressed={mode === "photo"} onClick={() => setMode("photo")}>
            A photo
          </button>
          <button type="button" onClick={startJournal}>
            A proper journal
          </button>
        </div>
        {mode === "text" ? (
          <label className={styles.field}>
            <span className="sr-only">A moment from today</span>
            <textarea
              ref={textInput}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Had ramen after class."
              maxLength={20_000}
              rows={5}
            />
          </label>
        ) : (
          <div className={styles.photoFields}>
            <label className={styles.file}>
              <span>{file ? file.name : "Pick a photo"}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <label className={styles.field}>
              Caption <span>(optional)</span>
              <input
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                placeholder="The sky was doing a lot."
                maxLength={2_000}
              />
            </label>
            <p className={styles.help}>
              JPEG, PNG, or WebP · up to 20 MB · saved privately on this device first.
            </p>
          </div>
        )}
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        <div className={styles.actions}>
          <button type="button" className={styles.nevermind} onClick={close}>
            Never mind
          </button>
          <button
            className={styles.save}
            disabled={busy || (mode === "text" ? !text.trim() : !file)}
          >
            {busy ? "Saving…" : "Put it on Today"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
