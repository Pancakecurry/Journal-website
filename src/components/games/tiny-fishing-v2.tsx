"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./games.module.css";

type GameState = "idle" | "casting" | "waiting" | "tug" | "reeling" | "caught" | "missed";
const FISH = [
  { name: "pocket carp", mark: "<°)))><", pull: 0.72 },
  { name: "library minnow", mark: "<·)))><", pull: 0.5 },
  { name: "umbrella fish", mark: "<☂))><", pull: 0.82 },
  { name: "paper koi", mark: "<◇)))><", pull: 0.65 },
] as const;

export default function TinyFishing({ onExit }: { onExit(): void }) {
  const [state, setState] = useState<GameState>("idle");
  const [castPower, setCastPower] = useState(0);
  const [tension, setTension] = useState(0.42);
  const [progress, setProgress] = useState(0);
  const [fish, setFish] = useState<(typeof FISH)[number]>(FISH[0]);
  const [caught, setCaught] = useState<string[]>([]);
  const timer = useRef<number | undefined>(undefined);
  const frame = useRef<number | undefined>(undefined);
  const direction = useRef(1);
  const holding = useRef(false);
  const tensionValue = useRef(0.42);
  const progressValue = useRef(0);
  const stopLoops = useCallback(() => {
    window.clearTimeout(timer.current);
    window.cancelAnimationFrame(frame.current ?? 0);
  }, []);
  useEffect(() => stopLoops, [stopLoops]);
  useEffect(() => {
    if (state !== "casting") return;
    let previous = performance.now();
    const tick = (now: number) => {
      const delta = Math.min(now - previous, 40);
      previous = now;
      setCastPower((value) => {
        let next = value + direction.current * delta * 0.08;
        if (next >= 100) {
          next = 100;
          direction.current = -1;
        }
        if (next <= 0) {
          next = 0;
          direction.current = 1;
        }
        return next;
      });
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame.current ?? 0);
  }, [state]);
  useEffect(() => {
    if (state !== "reeling") return;
    let previous = performance.now();
    const tick = (now: number) => {
      const delta = Math.min(now - previous, 40) / 1000;
      previous = now;
      tensionValue.current = Math.max(
        0,
        Math.min(1, tensionValue.current + (holding.current ? 0.62 : -0.34) * delta),
      );
      progressValue.current = Math.min(
        100,
        progressValue.current + (holding.current ? 18 : 4) * delta,
      );
      setTension(tensionValue.current);
      setProgress(progressValue.current);
      if (tensionValue.current >= 0.96) {
        setState("missed");
        stopLoops();
        return;
      }
      if (progressValue.current >= 100) {
        setCaught((items) => [...items, fish.name]);
        setState("caught");
        stopLoops();
        return;
      }
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame.current ?? 0);
  }, [fish.name, state, stopLoops]);
  function beginCast() {
    stopLoops();
    setCastPower(0);
    progressValue.current = 0;
    tensionValue.current = 0.4;
    setProgress(0);
    setTension(0.4);
    setState("casting");
  }
  function placeCast() {
    window.cancelAnimationFrame(frame.current ?? 0);
    setState("waiting");
    const selected = FISH[Math.floor((castPower / 101) * FISH.length)] ?? FISH[0];
    setFish(selected);
    timer.current = window.setTimeout(
      () => {
        setState("tug");
        timer.current = window.setTimeout(() => setState("missed"), 1_550);
      },
      650 + Math.random() * 1_250,
    );
  }
  function reel() {
    window.clearTimeout(timer.current);
    tensionValue.current = fish.pull * 0.45;
    progressValue.current = 0;
    setTension(tensionValue.current);
    setProgress(0);
    setState("reeling");
  }
  function exit() {
    stopLoops();
    onExit();
  }
  const waterCopy =
    state === "idle"
      ? "Quiet water."
      : state === "casting"
        ? "Choose where it lands."
        : state === "waiting"
          ? "The float is thinking about it…"
          : state === "tug"
            ? "The line just twitched!"
            : state === "reeling"
              ? "Easy. Keep it in the green."
              : state === "caught"
                ? `A ${fish.name}. Honestly, lovely.`
                : "It slipped off. The pond remains unbothered.";
  return (
    <section className={styles.game} aria-labelledby="fishing-game">
      <header>
        <div>
          <p>Window-side desk break · session pond</p>
          <h1 id="fishing-game">Tiny Fishing</h1>
        </div>
        <button onClick={exit}>Put it away</button>
      </header>
      <div className={styles.gameIntro}>
        <p>
          Cast into the paper pond, wait for the float, then mind the line. Your catch list vanishes
          when the game closes.
        </p>
        <span>{caught.length ? `This session: ${caught.join(", ")}` : "The tin is empty."}</span>
      </div>
      <div className={styles.pond} data-state={state} aria-live="polite">
        <div className={styles.sky}>
          <i aria-hidden="true" />
          <span aria-hidden="true">⌁</span>
        </div>
        <div className={styles.water}>
          <span
            className={styles.float}
            style={{ left: `${18 + castPower * 0.64}%` }}
            aria-hidden="true"
          >
            ●
          </span>
          {state === "caught" ? (
            <span className={styles.fish} aria-hidden="true">
              {fish.mark}
            </span>
          ) : null}
          <i aria-hidden="true" />
          <i aria-hidden="true" />
          <i aria-hidden="true" />
        </div>
        <strong>{waterCopy}</strong>
      </div>
      {state === "casting" ? (
        <div className={styles.castMeter}>
          <span>Near</span>
          <meter min="0" max="100" value={castPower} />
          <span>Far</span>
        </div>
      ) : null}
      {state === "reeling" ? (
        <div className={styles.reelPanel}>
          <label>
            Line tension{" "}
            <meter min="0" max="1" low={0.2} high={0.82} optimum={0.58} value={tension} />
          </label>
          <label>
            Fish to desk <progress max="100" value={progress} />
          </label>
        </div>
      ) : null}
      {state === "idle" || state === "caught" || state === "missed" ? (
        <button className={styles.cast} onClick={beginCast}>
          {state === "idle" ? "Cast" : "Cast again"}
        </button>
      ) : state === "casting" ? (
        <button className={styles.cast} onClick={placeCast}>
          Drop the line here
        </button>
      ) : state === "tug" ? (
        <button className={styles.cast} onClick={reel}>
          Reel it in
        </button>
      ) : state === "reeling" ? (
        <button
          className={styles.cast}
          onPointerDown={() => {
            holding.current = true;
          }}
          onPointerUp={() => {
            holding.current = false;
          }}
          onPointerLeave={() => {
            holding.current = false;
          }}
          onKeyDown={(event) => {
            if (event.key === " " || event.key === "Enter") holding.current = true;
          }}
          onKeyUp={() => {
            holding.current = false;
          }}
        >
          Hold gently to reel
        </button>
      ) : (
        <button className={styles.cast} disabled>
          Waiting for a tug…
        </button>
      )}
      <small>Pointer, touch, or keyboard all work. Reduced motion keeps the pond still.</small>
    </section>
  );
}
