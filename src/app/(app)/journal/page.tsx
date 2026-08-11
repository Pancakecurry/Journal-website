import type { Metadata } from "next";
import { JournalIndex } from "@/components/journal/journal-index";

export const metadata: Metadata = { title: "Journal" };
export default function JournalPage() {
  return <JournalIndex />;
}
