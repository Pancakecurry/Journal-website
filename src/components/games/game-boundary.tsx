"use client";
import { Component, type ReactNode } from "react";

export class GameBoundary extends Component<
  { children: ReactNode; onExit(): void },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch() {
    /* Private journal content is never logged. */
  }
  override render() {
    if (this.state.failed)
      return (
        <section role="alert">
          <h2>That desk toy jammed.</h2>
          <p>Your journal is fine. Close this and carry on.</p>
          <button onClick={this.props.onExit}>Close game</button>
        </section>
      );
    return this.props.children;
  }
}
