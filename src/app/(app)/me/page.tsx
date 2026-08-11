import type { Metadata } from "next";
import { FoundationScreen } from "@/components/foundation/foundation-screen";

export const metadata: Metadata = { title: "Me" };

export default function MePage() {
  return (
    <FoundationScreen
      intensity="notebook"
      label="Me · notebook"
      title="Your journal, on your terms."
      description="Privacy, app lock, offline and sync behavior, export, backup, accessibility, and appearance will be understandable here."
      emptyTitle="Preferences will arrive deliberately"
      emptyDescription="No consequential control is shown before it works. Remote account configuration is still required for authentication and sync."
    />
  );
}
