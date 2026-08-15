"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";
import styles from "./auth.module.css";

type Mode = "sign-in" | "create" | "recover";

export function AuthExperience({ configured }: { configured: boolean }) {
  const search = useSearchParams();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(
    configured ? "This is your private space." : "Remote accounts are not configured here.",
  );
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const client = createSupabaseBrowserClient();
    if (!client) return;
    setBusy(true);
    setMessage("One moment…");
    try {
      if (mode === "recover") {
        const { error } = await client.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset`,
        });
        if (error) throw error;
        setMessage("Recovery email sent. Check your inbox when you’re ready.");
        return;
      }
      if (mode === "create") {
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        if (!data.session) {
          setMessage("Account made. Check your email to finish signing in.");
          return;
        }
      } else {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      const next = safeNext(search.get("next"));
      window.location.assign(next);
    } catch {
      setMessage(
        mode === "create"
          ? "That account couldn’t be created. Check the details and try again."
          : mode === "recover"
            ? "That recovery email couldn’t be sent. Try again in a moment."
            : "Those sign-in details didn’t work. Nothing in your journal was changed.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!configured)
    return (
      <main className={styles.authPage}>
        <section className={styles.paper}>
          <p className={styles.eyebrow}>Local notebook</p>
          <h1>Your journal is right here.</h1>
          <p>
            Supabase is not configured, so this checkout uses the local-only foundation identity.
            Production builds do not get an account bypass.
          </p>
          <a className={styles.primary} href="/today">
            Open the local notebook
          </a>
        </section>
      </main>
    );

  return (
    <main className={styles.authPage}>
      <section className={styles.paper}>
        <p className={styles.eyebrow}>Campus Atelier</p>
        <h1>
          {mode === "create" ? "Make yourself a little corner." : "Welcome back to your corner."}
        </h1>
        <p>
          {mode === "recover"
            ? "We’ll send a private recovery link. No dramatic speeches required."
            : "Your writing stays behind your account. Sign in to open the notebook on this device."}
        </p>
        <form onSubmit={submit}>
          <label>
            Email
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          {mode !== "recover" ? (
            <label>
              Password
              <input
                required
                minLength={8}
                type="password"
                autoComplete={mode === "create" ? "new-password" : "current-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
          ) : null}
          <button className={styles.primary} disabled={busy}>
            {busy
              ? "Working…"
              : mode === "create"
                ? "Create my account"
                : mode === "recover"
                  ? "Send recovery email"
                  : "Open my journal"}
          </button>
        </form>
        <p className={styles.status} role="status" aria-live="polite">
          {message}
        </p>
        <nav aria-label="Account options">
          <button type="button" onClick={() => setMode(mode === "create" ? "sign-in" : "create")}>
            {mode === "create" ? "I already have an account" : "Create an account"}
          </button>
          <button type="button" onClick={() => setMode(mode === "recover" ? "sign-in" : "recover")}>
            {mode === "recover" ? "Back to sign in" : "Forgot password?"}
          </button>
        </nav>
      </section>
      <aside className={styles.note} aria-label="Privacy note">
        <b>Your writing starts here</b>
        <span>
          New pages save on this device first. Sync only uses the account you signed in with.
        </span>
      </aside>
    </main>
  );
}

function safeNext(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/today";
}
