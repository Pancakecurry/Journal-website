import type { Metadata } from "next";
import { AiPrivacyCenter } from "@/components/intelligence/ai-privacy-center";
export const metadata: Metadata = { title: "Privacy & AI" };
export default function PrivacyPage() {
  return <AiPrivacyCenter />;
}
