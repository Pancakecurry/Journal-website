import type { Metadata } from "next";
import { FoundationScreen } from "@/components/foundation/foundation-screen";

export const metadata: Metadata = { title: "Calendar" };

export default function CalendarPage() {
  return (
    <FoundationScreen
      intensity="notebook"
      label="Calendar · notebook"
      title="Every Day has a place."
      description="Calendar will be the refined index for finding when something happened—not a heatmap of how productive life looked."
      emptyTitle="History will gather here"
      emptyDescription="Dates will gain quiet marks only when your own moments live there. The full Calendar arrives in Phase 3."
    />
  );
}
