import type { Metadata } from "next";
import { TrackerDetail } from "@/components/trackers/tracker-workspace";
export const metadata: Metadata = { title: "Tracker" };
export default async function TrackerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TrackerDetail id={id} />;
}
