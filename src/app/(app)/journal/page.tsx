import type { Metadata } from "next";
import { FoundationScreen } from "@/components/foundation/foundation-screen";

export const metadata: Metadata = { title: "Journal" };

export default function JournalPage() {
  return (
    <FoundationScreen
      intensity="notebook"
      label="Journal · notebook"
      title="Longer writing, kept close."
      description="Journal will gather long-form writing while every entry remains attached to the Day where it belongs."
      emptyTitle="No long entries yet"
      emptyDescription="The writing editor is deliberately deferred. This index is ready without pretending that you have already written anything."
    />
  );
}
