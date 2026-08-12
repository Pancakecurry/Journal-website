import type { Metadata } from "next";
import { TrackerIndex } from "@/components/trackers/tracker-workspace";
export const metadata: Metadata = { title: "Trackers" };
export default function TrackersPage() {
  return <TrackerIndex />;
}
