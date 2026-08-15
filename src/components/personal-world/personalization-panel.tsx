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
        <div>
          <p>Atelier drawer · materials</p>
          <h1>Make the desk feel like yours.</h1>
        </div>
        <span>
          A small set of good paper, cloth, and color choices. Enough personality; no theme-control
          cockpit.
        </span>
      </header>
      <div className={styles.atelierLayout}>
        <section className={styles.preview} aria-label="Live notebook preview">
          <div className={styles.previewDesk} data-density={draft.environmentDensity}>
            <i className={styles.previewTape} aria-hidden="true" />
            <div
              className={styles.previewNotebook}
              data-preview-cover={draft.notebookCover}
              data-preview-paper={draft.paper}
            >
              <span>August notes · 14</span>
              <strong>Lunch absolutely counts.</strong>
              <p>Found a quiet table by the window. Stayed longer than planned.</p>
              <small>{PAPERS.find(([value]) => value === draft.paper)?.[1]} paper</small>
            </div>
            <span className={styles.previewTab}>TODAY</span>
            {draft.environmentDensity !== "minimal" ? (
              <span className={styles.previewClip} aria-hidden="true">
                ⌇
              </span>
            ) : null}
            {draft.environmentDensity === "expressive" ? (
              <span className={styles.previewNote}>bring the blue pen</span>
            ) : null}
          </div>
          <div className={styles.previewCaption}>
            <span>Live desk sample</span>
            <b>
              {COVERS.find(([value]) => value === draft.notebookCover)?.[1]} ·{" "}
              {PAPERS.find(([value]) => value === draft.paper)?.[1]}
            </b>
          </div>
        </section>
        <div className={styles.materialRack}>
          <ChoiceGroup
            label="Highlighter drawer"
            note="One accent leads; the notebook stays calm."
            options={ACCENTS}
            value={draft.accent}
            onChange={(value) => update("accent", value as Accent)}
            swatches
          />
          <ChoiceGroup
            label="Paper stack"
            note="This pattern follows focused and notebook surfaces."
            options={PAPERS}
            value={draft.paper}
            onChange={(value) => update("paper", value as PaperCharacter)}
            material="paper"
          />
          <ChoiceGroup
            label="Cover cloth"
            note="The edge you notice when you open your notebook."
            options={COVERS}
            value={draft.notebookCover}
            onChange={(value) => update("notebookCover", value as NotebookCover)}
            material="cover"
          />
          <ChoiceGroup
            label="Desk detail"
            note="How inhabited expressive spaces become."
            options={DENSITIES}
            value={draft.environmentDensity}
            onChange={(value) => update("environmentDensity", value as EnvironmentDensity)}
          />
          <ChoiceGroup
            label="Motion"
            note="System follows your device; Keep still removes nonessential movement."
            options={MOTION}
            value={draft.reducedMotionOverride}
            onChange={(value) =>
              update("reducedMotionOverride", value as UserPreferences["reducedMotionOverride"])
            }
          />
          <fieldset className={styles.memorySettings}>
            <legend>Old memory drawer</legend>
            <p>
              My World can occasionally tuck in something from this date. It never calls a quiet day
              incomplete.
            </p>
            <label>
              <input
                type="checkbox"
                checked={draft.memoryResurfacingEnabled}
                onChange={(event) => update("memoryResurfacingEnabled", event.target.checked)}
              />
              <span>
                <b>Show an old memory now and then</b>
                <small>You can hide any item or turn this off.</small>
              </span>
            </label>
            <label className={styles.rangeLabel}>
              <span>Look back up to</span>
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
        </div>
      </div>
      <div className={styles.preferenceActions}>
        <p role="status" aria-live="polite">
          {status}
        </p>
        <div>
          <button onClick={() => saved && setDraft(saved)}>Put it back</button>
          <button className={styles.primary} onClick={() => void save()}>
            Save these choices
          </button>
        </div>
      </div>
    </main>
  );
}

function ChoiceGroup({
  label,
  options,
  value,
  onChange,
  swatches = false,
  note,
  material,
}: {
  label: string;
  options: Array<[string, string]>;
  value: string;
  onChange(value: string): void;
  swatches?: boolean;
  note?: string;
  material?: "paper" | "cover";
}) {
  return (
    <fieldset className={styles.choices}>
      <legend>{label}</legend>
      {note ? <p>{note}</p> : null}
      <div>
        {options.map(([option, name]) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            data-material={material}
            data-option={option}
            onClick={() => onChange(option)}
          >
            {swatches ? <i data-swatch={option} aria-hidden="true" /> : null}
            <span>{name}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
