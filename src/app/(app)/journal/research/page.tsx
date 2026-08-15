import type { Metadata } from "next";
import { JournalResearch } from "@/components/intelligence/journal-research";
export const metadata: Metadata = { title: "Journal research" };
export default function ResearchPage() {
  return <JournalResearch />;
}
