"use client";

import { MotionConfig } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import type { UserPreferences } from "@/domain/preferences";
import { getApplicationDatabase } from "@/infrastructure/local/database";
import { LocalPersonalWorldRepository } from "@/infrastructure/local/personal-world-repository";
import { LOCAL_FOUNDATION_USER_ID } from "@/lib/journal-session";
import { useJournalIdentity } from "@/components/auth/journal-identity";

function applyPreferences(preferences: UserPreferences) {
  const root = document.documentElement;
  root.dataset.accent = preferences.accent;
  root.dataset.paper = preferences.paper;
  root.dataset.cover = preferences.notebookCover;
  root.dataset.density = preferences.environmentDensity;
  root.dataset.motion = preferences.reducedMotionOverride;
}

export function DesignSystemProvider({ children }: { children: ReactNode }) {
  const identity = useJournalIdentity();
  const [reducedMotion, setReducedMotion] = useState<"user" | "always" | "never">("user");
  useEffect(() => {
    let alive = true;
    if (identity.loading || !identity.userId) return;
    const repository = new LocalPersonalWorldRepository(getApplicationDatabase());
    void repository.preferences(LOCAL_FOUNDATION_USER_ID).then((preferences) => {
      if (!alive) return;
      applyPreferences(preferences);
      setReducedMotion(motionPreference(preferences));
    });
    const update = (event: Event) => {
      const preferences = (event as CustomEvent<UserPreferences>).detail;
      applyPreferences(preferences);
      setReducedMotion(motionPreference(preferences));
    };
    window.addEventListener("campus-atelier:preferences", update);
    return () => {
      alive = false;
      window.removeEventListener("campus-atelier:preferences", update);
    };
  }, [identity.loading, identity.userId]);
  return (
    <MotionConfig
      reducedMotion={reducedMotion}
      transition={{ duration: 0.22, ease: [0.2, 0.75, 0.25, 1] }}
    >
      {children}
    </MotionConfig>
  );
}

function motionPreference(preferences: UserPreferences): "user" | "always" | "never" {
  if (preferences.reducedMotionOverride === "reduce") return "always";
  return "user";
}
