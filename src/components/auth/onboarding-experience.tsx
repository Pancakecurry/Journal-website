"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useJournalIdentity } from "./journal-identity";
import { LocalPersonalWorldRepository } from "@/infrastructure/local/personal-world-repository";
import { getApplicationDatabase } from "@/infrastructure/local/database";
import type { Accent } from "@/domain/preferences";
import styles from "./auth.module.css";

const accents: Accent[] = ["powder", "sage", "lavender", "butter", "peach", "coral", "mint"];
export function OnboardingExperience() {
  const identity = useJournalIdentity();
  const router = useRouter();
  const [accent, setAccent] = useState<Accent>("powder");
  const [reflection, setReflection] = useState(true);
  const [busy, setBusy] = useState(false);
  if (identity.loading || !identity.userId)
    return (
      <main className="identity-loading">
        <p>Preparing a clean notebook…</p>
      </main>
    );
  return (
    <main className={styles.authPage}>
      <section className={styles.paper}>
        <p className={styles.eyebrow}>A two-minute setup, minus the two minutes</p>
        <h1>Make it feel like yours.</h1>
        <p>Pick a stationery accent. Morning and evening questions stay optional either way.</p>
        <fieldset>
          <legend>Notebook accent</legend>
          <div className={styles.swatches}>
            {accents.map((item) => (
              <button
                type="button"
                key={item}
                data-accent={item}
                aria-pressed={accent === item}
                onClick={() => setAccent(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </fieldset>
        <label className={styles.reflectionChoice}>
          <input
            type="checkbox"
            checked={reflection}
            onChange={(event) => setReflection(event.target.checked)}
          />{" "}
          Offer optional check-ins
        </label>
        <button
          className={styles.primary}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await new LocalPersonalWorldRepository(getApplicationDatabase()).savePreferences(
              identity.userId!,
              { accent, reflectionEnabled: reflection, onboardingComplete: true },
            );
            router.replace("/today");
            router.refresh();
          }}
        >
          Open Today
        </button>
        <p>One sentence counts. So does absolutely nothing.</p>
      </section>
    </main>
  );
}
