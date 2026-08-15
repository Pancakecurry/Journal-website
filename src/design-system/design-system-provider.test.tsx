import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UserPreferencesSchema } from "@/domain/preferences";
import { DesignSystemProvider } from "./design-system-provider";

const preference = UserPreferencesSchema.parse({
  userId: "11111111-1111-4111-8111-111111111111",
  accent: "mint",
  paper: "grid",
  notebookCover: "sage",
  environmentDensity: "minimal",
  reflectionEnabled: true,
  reducedMotionOverride: "reduce",
  memoryResurfacingEnabled: true,
  memoryRangeYears: 3,
  createdAt: "2026-08-15T08:00:00.000Z",
  updatedAt: "2026-08-15T08:00:00.000Z",
  version: 1,
  syncState: "local",
});

describe("DesignSystemProvider", () => {
  it("applies a live semantic theme without replacing content", async () => {
    render(
      <DesignSystemProvider>
        <p>ordinary page</p>
      </DesignSystemProvider>,
    );
    window.dispatchEvent(new CustomEvent("campus-atelier:preferences", { detail: preference }));
    await waitFor(() => expect(document.documentElement.dataset.accent).toBe("mint"));
    expect(document.documentElement).toHaveAttribute("data-paper", "grid");
    expect(document.documentElement).toHaveAttribute("data-cover", "sage");
    expect(document.documentElement).toHaveAttribute("data-motion", "reduce");
    expect(screen.getByText("ordinary page")).toBeVisible();
  });
});
