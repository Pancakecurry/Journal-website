import type { Metadata } from "next";
import { TodayExperience } from "@/components/today/today-experience";

export const metadata: Metadata = { title: "Today" };

export default function TodayPage() {
  return <TodayExperience />;
}
