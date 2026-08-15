import type { Metadata } from "next";
import { DoodleLibrary } from "@/components/personal-world/doodle-library";
export const metadata: Metadata = { title: "Sketchbook" };
export default function DoodlesPage() {
  return <DoodleLibrary />;
}
