import type { Metadata } from "next";
import { DoodleStudio } from "@/components/personal-world/doodle-studio";
export const metadata: Metadata = { title: "New doodle" };
export default function NewDoodlePage() {
  return <DoodleStudio fresh />;
}
