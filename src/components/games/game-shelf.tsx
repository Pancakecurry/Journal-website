"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { GAME_REGISTRY, type GameId } from "./game-registry";
import { GameBoundary } from "./game-boundary";
import styles from "./games.module.css";

const MemoryFlip = dynamic(() => import("./memory-flip-v2"), {
  ssr: false,
  loading: () => <p>Opening the card tin…</p>,
});
const TinyFishing = dynamic(() => import("./tiny-fishing-v2"), {
  ssr: false,
  loading: () => <p>Untangling the tiny line…</p>,
});

export function GameShelf() {
  const [active, setActive] = useState<GameId>();
  const close = () => setActive(undefined);
  return (
    <main className={styles.shelf}>
      <header>
        <p>Desk-break drawer · local only</p>
        <h1>Nothing useful in here.</h1>
        <span>
          {"That's why it's good. Sound is off. There are no streaks, coins, or leaderboards."}
        </span>
        <Link href="/my-world">Back to your desk</Link>
      </header>
      <AnimatePresence mode="wait" initial={false}>
        {active ? (
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <GameBoundary onExit={close}>
              {active === "memory-flip" ? (
                <MemoryFlip onExit={close} />
              ) : (
                <TinyFishing onExit={close} />
              )}
            </GameBoundary>
          </motion.div>
        ) : (
          <motion.div
            key="shelf"
            className={styles.gameChoices}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {GAME_REGISTRY.map((game) => (
              <button key={game.id} onClick={() => setActive(game.id)}>
                <strong>{game.name}</strong>
                <span>{game.description}</span>
                <small>Open desk toy</small>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
