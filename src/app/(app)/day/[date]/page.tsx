import type { Metadata } from "next";
import { HistoricalDay } from "@/components/history/historical-day";

export const metadata: Metadata = { title: "A Day" };
export default function HistoricalDayPage() {
  return <HistoricalDay />;
}
