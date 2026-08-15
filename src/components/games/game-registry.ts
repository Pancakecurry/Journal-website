export const GAME_REGISTRY = [
  {
    id: "memory-flip",
    name: "Memory Flip",
    description: "Match stationery bits. Your journal stays out of it unless you choose otherwise.",
  },
  {
    id: "tiny-fishing",
    name: "Tiny Fishing",
    description: "Cast, wait for the tiny tug, then get back to whatever you were avoiding.",
  },
] as const;
export type GameId = (typeof GAME_REGISTRY)[number]["id"];
