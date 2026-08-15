import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GameBoundary } from "./game-boundary";
import MemoryFlip from "./memory-flip";
import TinyFishing from "./tiny-fishing";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("isolated desk games", () => {
  it("keeps Memory Flip progress local to the mounted session", () => {
    const { unmount } = render(<MemoryFlip onExit={() => undefined} />);
    fireEvent.click(screen.getByRole("button", { name: /^Turn over card 1$/ }));
    expect(screen.getByRole("button", { name: "Card 1: ✎" })).toBeVisible();
    unmount();
    render(<MemoryFlip onExit={() => undefined} />);
    expect(screen.getByRole("button", { name: /^Turn over card 1$/ })).toBeVisible();
  });

  it("cleans Tiny Fishing timers when the game is put away", () => {
    vi.useFakeTimers();
    const onExit = vi.fn();
    const clear = vi.spyOn(window, "clearTimeout");
    const { unmount } = render(<TinyFishing onExit={onExit} />);
    fireEvent.click(screen.getByRole("button", { name: "Cast" }));
    fireEvent.click(screen.getByRole("button", { name: "Put it away" }));
    unmount();
    act(() => vi.runAllTimers());
    expect(onExit).toHaveBeenCalledOnce();
    expect(clear).toHaveBeenCalled();
  });

  it("contains a failed game without taking down the shelf", () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const BrokenGame = () => {
      throw new Error("tiny game broke");
    };
    render(
      <GameBoundary onExit={() => undefined}>
        <BrokenGame />
      </GameBoundary>,
    );
    expect(screen.getByRole("heading", { name: "That desk toy jammed." })).toBeVisible();
    quiet.mockRestore();
  });
});
