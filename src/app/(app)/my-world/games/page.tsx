import type { Metadata } from "next";
import { GameShelf } from "@/components/games/game-shelf";
export const metadata: Metadata = { title: "Desk breaks" };
export default function GamesPage() {
  return <GameShelf />;
}
