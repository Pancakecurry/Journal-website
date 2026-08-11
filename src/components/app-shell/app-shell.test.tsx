import { render, screen } from "@testing-library/react";
import { vi, describe, expect, it } from "vitest";
import { AppShell } from "@/components/app-shell/app-shell";

vi.mock("next/navigation", () => ({ usePathname: () => "/today" }));

describe("AppShell", () => {
  it("provides semantic primary navigation and the near-global capture action", () => {
    render(
      <AppShell>
        <h1>Today content</h1>
      </AppShell>,
    );
    const navigation = screen.getByRole("navigation", { name: "Primary" });
    expect(navigation).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Today" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Calendar" })).toHaveAttribute("href", "/calendar");
    expect(screen.getByRole("link", { name: "+ Add to Today" })).toHaveAttribute(
      "href",
      "/today#quick-capture",
    );
    expect(screen.getByRole("link", { name: "Skip to main content" })).toHaveAttribute(
      "href",
      "#main-content",
    );
  });
});
