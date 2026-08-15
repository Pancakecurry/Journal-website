"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./games.module.css";

export default function TinyFishing({ onExit }: { onExit(): void }) {
  const [state, setState] = useState<"idle" | "waiting" | "tug" | "caught">("idle");
  const [casts, setCasts] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  function cast() {
    window.clearTimeout(timer.current);
    setCasts((value) => value + 1);
    setState("waiting");
    timer.current = window.setTimeout(() => setState("tug"), 650 + (casts % 3) * 260);
  }
  function exit() {
    window.clearTimeout(timer.current);
    onExit();
  }
  return (
    <section className={styles.game} aria-labelledby="fishing-game">
      <header>
        <div>
          <p>Window-side desk break</p>
          <h1 id="fishing-game">Tiny Fishing</h1>
        </div>
        <button onClick={exit}>Put it away</button>
      </header>
      <p>{"Cast. Wait for the tug. That's the entire business model."}</p>
      <div className={styles.pond} data-state={state} aria-live="polite">
        <span aria-hidden="true">
          {state === "caught" ? "<°)))><" : state === "tug" ? "!" : "~  ~  ~"}
        </span>
        <strong>
          {state === "idle"
            ? "Quiet water."
            : state === "waiting"
              ? "Waiting…"
              : state === "tug"
                ? "Tiny tug!"
                : "A perfectly ordinary fish."}
        </strong>
      </div>
      {state === "tug" ? (
        <button
          className={styles.cast}
          onClick={() => {
            window.clearTimeout(timer.current);
            setState("caught");
          }}
        >
          Reel it in
        </button>
      ) : (
        <button className={styles.cast} onClick={cast}>
          {state === "caught" ? "Cast again" : "Cast"}
        </button>
      )}
      <small>Pointer, touch, or keyboard: the buttons work with all three.</small>
    </section>
  );
}
