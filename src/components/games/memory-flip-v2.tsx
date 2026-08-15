"use client";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import styles from "./games.module.css";

const THEMES = [
  { name: "Desk drawer", marks: ["✎", "⌁", "☕", "▤", "✦", "◌", "⌂", "♧", "⌕", "◇"] },
  { name: "Late library", marks: ["☾", "⌁", "⌘", "✦", "◒", "▥", "♢", "☕", "⌛", "◌"] },
  { name: "Window garden", marks: ["♧", "❀", "☼", "⌁", "◌", "♢", "☂", "❋", "☕", "⌂"] },
] as const;
const SIZES = [
  { label: "Small", pairs: 6 },
  { label: "Medium", pairs: 8 },
  { label: "Wide", pairs: 10 },
] as const;

export default function MemoryFlip({ onExit }: { onExit(): void }) {
  const [pairs, setPairs] = useState(6);
  const [round, setRound] = useState(0);
  const cards = useMemo(
    () => makeCards(THEMES[round % THEMES.length]!.marks.slice(0, pairs)),
    [pairs, round],
  );
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [turns, setTurns] = useState(0);
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    if (open.length !== 2) return;
    const task = window.setTimeout(() => {
      const [left, right] = open;
      if (cards[left!]?.mark === cards[right!]?.mark)
        setMatched((items) => [...items, left!, right!]);
      setOpen([]);
      setLocked(false);
    }, 620);
    return () => window.clearTimeout(task);
  }, [cards, open]);
  function reset(nextPairs = pairs) {
    setPairs(nextPairs);
    setOpen([]);
    setMatched([]);
    setTurns(0);
    setLocked(false);
    setRound((value) => value + 1);
  }
  const complete = matched.length === cards.length;
  return (
    <section className={styles.game} aria-labelledby="memory-game">
      <header>
        <div>
          <p>Card tin · {THEMES[round % THEMES.length]!.name}</p>
          <h1 id="memory-game">Memory Flip</h1>
        </div>
        <button onClick={onExit}>Put it away</button>
      </header>
      <div className={styles.gameIntro}>
        <p>Pick a little layout, then match the desk bits. No timer breathing down your neck.</p>
        <span>
          {turns} {turns === 1 ? "turn" : "turns"} · {matched.length / 2} pairs tucked away
        </span>
      </div>
      <div className={styles.sizePicker} aria-label="Board size">
        {SIZES.map((size) => (
          <button
            key={size.pairs}
            aria-pressed={pairs === size.pairs}
            onClick={() => reset(size.pairs)}
          >
            {size.label}
            <small>{size.pairs} pairs</small>
          </button>
        ))}
      </div>
      <div className={styles.cardGrid} data-pairs={pairs}>
        {cards.map((card, index) => {
          const visible = open.includes(index) || matched.includes(index);
          return (
            <motion.button
              key={card.id}
              aria-label={
                visible ? `Card ${index + 1}: ${card.mark}` : `Turn over card ${index + 1}`
              }
              disabled={locked || matched.includes(index)}
              data-open={visible}
              data-matched={matched.includes(index)}
              initial={false}
              animate={{ rotateY: visible ? 180 : 0, y: matched.includes(index) ? -3 : 0 }}
              transition={{ duration: 0.34, ease: [0.2, 0.8, 0.2, 1] }}
              onClick={() => {
                if (visible || locked) return;
                const next = [...open, index];
                setOpen(next);
                if (next.length === 2) {
                  setLocked(true);
                  setTurns((value) => value + 1);
                }
              }}
            >
              <span aria-hidden="true">{visible ? card.mark : "CA"}</span>
            </motion.button>
          );
        })}
      </div>
      {complete ? (
        <motion.div
          className={styles.done}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <strong>Drawer sorted.</strong>
            <span>{turns} turns. Neat enough.</span>
          </div>
          <button onClick={() => reset()}>Shuffle another round</button>
        </motion.div>
      ) : null}
    </section>
  );
}

function makeCards(marks: readonly string[]) {
  const cards = [...marks, ...marks].map((mark, index) => ({ id: `${mark}-${index}`, mark }));
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [cards[index], cards[swap]] = [cards[swap]!, cards[index]!];
  }
  return cards;
}
