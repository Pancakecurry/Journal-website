import type { Metadata } from "next";
import Link from "next/link";
import { FoundationScreen } from "@/components/foundation/foundation-screen";
export const metadata: Metadata = { title: "Me" };
export default function MePage() {
  return (
    <FoundationScreen
      intensity="notebook"
      label="Me · notebook"
      title="Your journal, on your terms."
      description="Preferences stay understandable. No mystery switches."
      emptyTitle="Pick a divider"
      emptyDescription="Track the odd little things you care about, or leave everything alone."
    >
      <Link href="/me/trackers">Open trackers</Link>
    </FoundationScreen>
  );
}
