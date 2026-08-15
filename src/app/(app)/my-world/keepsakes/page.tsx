import type { Metadata } from "next";
import { KeepsakeArchive } from "@/components/personal-world/keepsake-archive";

export const metadata: Metadata = { title: "Keepsakes" };
export default function KeepsakesPage() {
  return <KeepsakeArchive />;
}
