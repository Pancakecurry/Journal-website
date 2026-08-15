import type { Metadata } from "next";
import { DoodleStudio } from "@/components/personal-world/doodle-studio";
export const metadata: Metadata = { title: "Doodle" };
export default function DoodlePage() {
  return <DoodleStudio />;
}
