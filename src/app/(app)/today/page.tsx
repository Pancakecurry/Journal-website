import type { Metadata } from "next";
import { TodayFoundation } from "@/components/today/today-foundation";

export const metadata: Metadata = { title: "Today" };

export default function TodayPage() {
  return <TodayFoundation />;
}
