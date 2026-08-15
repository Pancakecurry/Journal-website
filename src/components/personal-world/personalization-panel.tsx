"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  Accent,
  EnvironmentDensity,
  NotebookCover,
  PaperCharacter,
  UserPreferences,
} from "@/domain/preferences";
import { getApplicationDatabase } from "@/infrastructure/local/database";
import { LocalPersonalWorldRepository } from "@/infrastructure/local/personal-world-repository";
import { LOCAL_FOUNDATION_USER_ID } from "@/lib/journal-session";
import styles from "./personal-world.module.css";

const ACCENTS: Array<[Accent, string]> = [
  ["powder", "Powder blue"],
  ["sage", "Sage"],
  ["lavender", "Lavender"],
  ["butter", "Butter yellow"],
  ["peach", "Soft peach"],
  ["coral", "Coral"],
  ["mint", "Mint"],
];
const PAPERS: Array<[PaperCharacter, string]> = [
  ["clean", "Clean"],
  ["ruled", "Ruled"],
  ["dot", "Dot grid"],
  ["grid", "Fine grid"],
];
const COVERS: Array<[NotebookCover, string]> = [
  ["canvas", "Warm canvas"],
  ["navy", "Library navy"],
  ["sage", "Field sage"],
  ["lavender", "Soft lavender"],
  ["ochre", "Ochre cloth"],
];
const DENSITIES: Array<[EnvironmentDensity, string]> = [
  ["minimal", "Minimal"],
  ["standard", "Standard"],
  ["expressive", "Expressive"],
];
const MOTION: Array<[UserPreferences["reducedMotionOverride"], string]> = [
  ["system", "Match this device"],
  ["reduce", "Keep things still"],
];

export function PersonalizationPanel() {
  const repository = useMemo(() => new LocalPersonalWorldRepository(getApplicationDatabase()), []);
  const [saved, setSaved] = useState<UserPreferences>();
  const [draft, setDraft] = useState<UserPreferences>();
  const [status, setStatus] = useState("Opening your stationery drawer…");
  useEffect(() => {
    let alive = true;
    void repository.preferences(LOCAL_FOUNDATION_USER_ID).then((item) => {
      if (!alive) return;
      setSaved(item);
      setDraft(item);
      setStatus("Nothing changes until you save.");
    });
    return () => {
      alive = false;
    };
  }, [repository]);
  useEffect(() => {
    if (!draft) return;
    window.dispatchEvent(new CustomEvent("campus-atelier:preferences", { detail: draft }));
    return () => {
      if (saved)
        window.dispatchEvent(new CustomEvent("campus-atelier:preferences", { detail: saved }));
    };
  }, [draft, saved]);
  if (!draft) return <p className={styles.loading}>{status}</p>;
  const update = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) =>
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  async function save() {
    const item = await repository.savePreferences(LOCAL_FOUNDATION_USER_ID, {
      accent: draft!.accent,
      paper: draft!.paper,
      notebookCover: draft!.notebookCover,
      environmentDensity: draft!.environmentDensity,
      reducedMotionOverride: draft!.reducedMotionOverride,
      memoryResurfacingEnabled: draft!.memoryResurfacingEnabled,
      memoryRangeYears: draft!.memoryRangeYears,
    });
    setSaved(item);
    setDraft(item);
    setStatus("Saved here. Your notebook looks like yours now.");
  }
  return (
    <main className={styles.preferences}>
      <header>
        <p>Appearance · notebook materials</p>
        <h1>Pick your stationery.</h1>
        <span>A few good choices. No 400-switch theme laboratory.</span>
      </header>
      <section className={styles.preview} aria-label="Live notebook preview">
        <div data-preview-cover={draft.notebookCover}>
          <span>August notes</span>
          <strong>Lunch absolutely counts.</strong>
          <small>{PAPERS.find(([value]) => value === draft.paper)?.[1]} paper</small>
        </div>
      </section>
      <ChoiceGroup
        label="Accent family"
        options={ACCENTS}
        value={draft.accent}
        onChange={(value) => update("accent", value as Accent)}
        swatches
      />
      <ChoiceGroup
        label="Paper character"
        options={PAPERS}
        value={draft.paper}
        onChange={(value) => update("paper", value as PaperCharacter)}
      />
      <ChoiceGroup
        label="Notebook cover"
        options={COVERS}
        value={draft.notebookCover}
        onChange={(value) => update("notebookCover", value as NotebookCover)}
      />
      <ChoiceGroup
        label="Desk detail"
        options={DENSITIES}
        value={draft.environmentDensity}
        onChange={(value) => update("environmentDensity", value as EnvironmentDensity)}
      />
      <ChoiceGroup
        label="Motion"
        options={MOTION}
        value={draft.reducedMotionOverride}
        onChange={(value) =>
          update("reducedMotionOverride", value as UserPreferences["reducedMotionOverride"])
        }
      />
      <fieldset className={styles.memorySettings}>
        <legend>Old memories</legend>
        <label>
          <input
            type="checkbox"
            checked={draft.memoryResurfacingEnabled}
            onChange={(event) => update("memoryResurfacingEnabled", event.target.checked)}
          />
          Occasionally show something from this date inside My World
        </label>
        <label>
          Look back up to
          <select
            value={draft.memoryRangeYears}
            onChange={(event) => update("memoryRangeYears", Number(event.target.value))}
            disabled={!draft.memoryResurfacingEnabled}
          >
            {[1, 3, 5, 10].map((value) => (
              <option key={value} value={value}>
                {value} {value === 1 ? "year" : "years"}
              </option>
            ))}
          </select>
        </label>
      </fieldset>
      <div className={styles.preferenceActions}>
        <button onClick={() => saved && setDraft(saved)}>Put it back</button>
        <button className={styles.primary} onClick={() => void save()}>
          Save these choices
        </button>
      </div>
      <p role="status">{status}</p>
    </main>
  );
}

function ChoiceGroup({
  label,
  options,
  value,
  onChange,
  swatches = false,
}: {
  label: string;
  options: Array<[string, string]>;
  value: string;
  onChange(value: string): void;
  swatches?: boolean;
}) {
  return (
    <fieldset className={styles.choices}>
      <legend>{label}</legend>
      <div>
        {options.map(([option, name]) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            onClick={() => onChange(option)}
          >
            {swatches ? <i data-swatch={option} aria-hidden="true" /> : null}
            {name}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
