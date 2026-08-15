"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { RemoteAiProvider } from "@/application/ai-provider";
import { SemanticMemoryRepository } from "@/application/semantic-memory";
import { DEFAULT_AI_SCOPES, type AiContentScopes, type AiSourceKind } from "@/domain/intelligence";
import type { UserPreferences } from "@/domain/preferences";
import { getApplicationDatabase } from "@/infrastructure/local/database";
import { LocalPersonalWorldRepository } from "@/infrastructure/local/personal-world-repository";
import { LOCAL_FOUNDATION_USER_ID } from "@/lib/journal-session";
import styles from "./intelligence.module.css";

const scopeCopy: { kind: AiSourceKind; title: string; detail: string }[] = [
  { kind: "journal", title: "Journal pages", detail: "Long-form entries and their titles" },
  { kind: "moment", title: "Short moments", detail: "The quick notes placed on a Day" },
  { kind: "reflection", title: "Reflections", detail: "Morning and evening answers" },
  {
    kind: "photo_caption",
    title: "Photo captions",
    detail: "Caption text only. Never the photograph.",
  },
  { kind: "tracker", title: "Tracker notes", detail: "Names, text values, and notes where useful" },
  {
    kind: "monthly_reflection",
    title: "Monthly reflections",
    detail: "The words you wrote in recaps",
  },
  {
    kind: "doodle",
    title: "Doodle notes",
    detail: "Titles and descriptions, not the drawing image",
  },
];

export function AiPrivacyCenter() {
  const database = useMemo(() => getApplicationDatabase(), []);
  const preferencesRepository = useMemo(
    () => new LocalPersonalWorldRepository(database),
    [database],
  );
  const provider = useMemo(() => new RemoteAiProvider(), []);
  const semantic = useMemo(
    () => new SemanticMemoryRepository(database, provider),
    [database, provider],
  );
  const [preferences, setPreferences] = useState<UserPreferences>();
  const [scopes, setScopes] = useState<AiContentScopes>(DEFAULT_AI_SCOPES);
  const [confirmed, setConfirmed] = useState(false);
  const [providerStatus, setProviderStatus] =
    useState<Awaited<ReturnType<RemoteAiProvider["status"]>>>();
  const [indexState, setIndexState] =
    useState<Awaited<ReturnType<SemanticMemoryRepository["state"]>>>();
  const [message, setMessage] = useState("Loading the privacy card…");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void Promise.all([
      preferencesRepository.preferences(LOCAL_FOUNDATION_USER_ID),
      provider.status(),
      semantic.state(LOCAL_FOUNDATION_USER_ID),
    ]).then(([saved, status, state]) => {
      setPreferences(saved);
      setScopes(saved.aiContentScopes);
      setProviderStatus(status);
      setIndexState(state);
      setMessage("");
    });
  }, [preferencesRepository, provider, semantic]);

  async function enableAi() {
    if (!confirmed || !Object.values(scopes).some(Boolean)) {
      setMessage("Choose what AI may read, then tick the consent box.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/ai/consent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirmed: true, scopes: enabledKinds(scopes) }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(body?.error ?? "AI consent could not be saved.");
      const saved = await preferencesRepository.savePreferences(LOCAL_FOUNDATION_USER_ID, {
        aiEnabled: true,
        aiExternalProcessingConsent: true,
        aiContentScopes: scopes,
      });
      setPreferences(saved);
      setMessage("AI is on for exactly the categories below. Nothing has been indexed yet.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "AI could not be enabled.");
    } finally {
      setBusy(false);
    }
  }

  async function disableAi() {
    setBusy(true);
    await fetch("/api/ai/consent", { method: "DELETE" }).catch(() => undefined);
    const saved = await preferencesRepository.savePreferences(LOCAL_FOUNDATION_USER_ID, {
      aiEnabled: false,
      aiExternalProcessingConsent: false,
    });
    setPreferences(saved);
    setConfirmed(false);
    setMessage("AI is off. Ordinary search and your journal still work exactly as before.");
    setBusy(false);
  }

  async function buildIndex() {
    setBusy(true);
    setMessage("Preparing the selected words. You can leave this page if you need to.");
    try {
      const state = await semantic.rebuild(LOCAL_FOUNDATION_USER_ID, scopes, {
        onProgress: (done, total) =>
          setMessage(
            total
              ? `Indexing ${done} of ${total} pieces…`
              : "Everything selected is already current.",
          ),
      });
      setIndexState(state);
      setMessage("Your meaning index is ready.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Indexing stopped.");
    } finally {
      setBusy(false);
    }
  }

  async function removeIndex() {
    setBusy(true);
    await semantic.removeDerivedData(LOCAL_FOUNDATION_USER_ID);
    setIndexState(undefined);
    setMessage("Derived AI index removed. Your original journal is untouched.");
    setBusy(false);
  }

  if (!preferences) return <main className={styles.loading}>{message}</main>;
  return (
    <main className={styles.privacyPage}>
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Privacy desk · AI</p>
          <h1>Your words don’t wander off by accident.</h1>
        </div>
        <div className={styles.statusCard} data-on={preferences.aiEnabled}>
          <span>{preferences.aiEnabled ? "AI on" : "AI off"}</span>
          <b>{providerStatus?.available ? providerStatus.provider : "Provider unavailable"}</b>
          <small>{preferences.aiEnabled ? "Scoped by you" : "Nothing is sent"}</small>
        </div>
      </header>
      <section className={styles.explainer}>
        <div>
          <span>01</span>
          <h2>You choose</h2>
          <p>Pick the kinds of writing AI may process. Blank means no.</p>
        </div>
        <div>
          <span>02</span>
          <h2>We fetch less</h2>
          <p>Only a handful of relevant excerpts go into a question.</p>
        </div>
        <div>
          <span>03</span>
          <h2>Sources stay visible</h2>
          <p>Answers point back to the Day or page they used.</p>
        </div>
      </section>
      <section className={styles.scopeSheet} aria-labelledby="scope-title">
        <div className={styles.sectionHeading}>
          <div>
            <p>Permission slip</p>
            <h2 id="scope-title">What may AI read?</h2>
          </div>
          <span>Photographs themselves are never processed.</span>
        </div>
        <div className={styles.scopeGrid}>
          {scopeCopy.map((item) => (
            <label className={styles.scope} key={item.kind} data-checked={scopes[item.kind]}>
              <input
                type="checkbox"
                checked={scopes[item.kind]}
                disabled={preferences.aiEnabled || busy}
                onChange={(event) =>
                  setScopes((current) => ({ ...current, [item.kind]: event.target.checked }))
                }
              />
              <span>
                <b>{item.title}</b>
                <small>{item.detail}</small>
              </span>
              <i aria-hidden="true">{scopes[item.kind] ? "✓" : "+"}</i>
            </label>
          ))}
        </div>
        {!preferences.aiEnabled ? (
          <label className={styles.consent}>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            <span>
              I understand selected text will be sent to{" "}
              <b>{providerStatus?.provider ?? "the configured provider"}</b> when I index or ask a
              question. Provider retention rules may apply.
            </span>
          </label>
        ) : null}
        <div className={styles.actions}>
          {preferences.aiEnabled ? (
            <button
              className={styles.dangerButton}
              disabled={busy}
              onClick={() => void disableAi()}
            >
              Turn AI off
            </button>
          ) : (
            <button
              className={styles.primaryButton}
              disabled={busy || !providerStatus?.available}
              onClick={() => void enableAi()}
            >
              Enable selected AI access
            </button>
          )}
          {!providerStatus?.available ? (
            <p>
              Server keys and private identity are not configured. That’s fine. Journaling stays
              fully available.
            </p>
          ) : null}
        </div>
      </section>
      <section className={styles.indexCard}>
        <div>
          <p>Derived, not original</p>
          <h2>Meaning index</h2>
          <span>
            {indexState?.status === "ready"
              ? `Ready · ${indexState.totalSources} updated pieces`
              : "Not built yet"}
          </span>
        </div>
        <div className={styles.actions}>
          <button disabled={busy || !preferences.aiEnabled} onClick={() => void buildIndex()}>
            {indexState ? "Update index" : "Build meaning index"}
          </button>
          {indexState ? (
            <button
              className={styles.quietButton}
              disabled={busy}
              onClick={() => void removeIndex()}
            >
              Delete derived index
            </button>
          ) : null}
        </div>
      </section>
      <p className={styles.live} role="status" aria-live="polite">
        {message}
      </p>
      {preferences.aiEnabled && indexState?.status === "ready" ? (
        <Link className={styles.researchLink} href="/journal/research">
          Open journal research desk <span aria-hidden="true">→</span>
        </Link>
      ) : null}
      <aside className={styles.finePrint}>
        <h2>The plain-English bit</h2>
        <p>
          OpenAI is the initial optional processor. Requests are stateless, but provider
          abuse-monitoring retention may apply unless the operator has approved data controls.
          Campus Atelier does not train on your journal, does not send image bytes, and does not
          keep assistant conversations.
        </p>
      </aside>
    </main>
  );
}

function enabledKinds(scopes: AiContentScopes): AiSourceKind[] {
  return (Object.entries(scopes) as [AiSourceKind, boolean][])
    .filter(([, enabled]) => enabled)
    .map(([kind]) => kind);
}
