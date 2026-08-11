import type { Metadata } from "next";
import { JournalEditor } from "@/components/journal/journal-editor";

export const metadata: Metadata = { title: "Journal page" };

export default function JournalEntryPage() {
  return <JournalEditor />;
}
