"use client";
import { useEffect, useState } from "react";
import styles from "./games.module.css";

const CARDS = ["✎", "⌁", "☕", "▤", "✦", "◌", "▤", "✎", "◌", "☕", "⌁", "✦"].map((mark, index) => ({
  id: index,
  mark,
}));

export default function MemoryFlip({ onExit }: { onExit(): void }) {
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    if (open.length !== 2) return;
    const task = window.setTimeout(() => {
      const [left, right] = open;
      if (CARDS[left!]?.mark === CARDS[right!]?.mark)
        setMatched((items) => [...items, left!, right!]);
      setOpen([]);
      setLocked(false);
    }, 520);
    return () => window.clearTimeout(task);
  }, [open]);
  const complete = matched.length === CARDS.length;
  return (
    <section className={styles.game} aria-labelledby="memory-game">
      <header>
        <div>
          <p>Card tin</p>
          <h1 id="memory-game">Memory Flip</h1>
        </div>
        <button onClick={onExit}>Put it away</button>
      </header>
      <p>Match the desk bits. Nothing is timed and nobody is keeping score.</p>
      <div className={styles.cardGrid}>
        {CARDS.map((card, index) => {
          const visible = open.includes(index) || matched.includes(index);
          return (
            <button
              key={card.id}
              aria-label={
                visible ? `Card ${index + 1}: ${card.mark}` : `Turn over card ${index + 1}`
              }
              disabled={locked || matched.includes(index)}
              data-open={visible}
              onClick={() => {
                if (visible || locked) return;
                const next = [...open, index];
                setOpen(next);
                if (next.length === 2) setLocked(true);
              }}
            >
              {visible ? card.mark : "?"}
            </button>
          );
        })}
      </div>
      {complete ? (
        <div className={styles.done}>
          <strong>Nicely matched.</strong>
          <button
            onClick={() => {
              setMatched([]);
              setOpen([]);
            }}
          >
            Again
          </button>
        </div>
      ) : null}
    </section>
  );
}
