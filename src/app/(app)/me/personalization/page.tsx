import type { Metadata } from "next";
import { PersonalizationPanel } from "@/components/personal-world/personalization-panel";

export const metadata: Metadata = { title: "Personalization" };

export default function PersonalizationPage() {
  return <PersonalizationPanel />;
}
