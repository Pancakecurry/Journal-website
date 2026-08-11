import type { Metadata } from "next";
import { DayIndex } from "@/components/history/day-index";
export const metadata: Metadata = { title: "Calendar" };
export default function CalendarPage() {
  return <DayIndex />;
}
