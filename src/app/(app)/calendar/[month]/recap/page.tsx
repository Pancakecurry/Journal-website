import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MonthlyRecap } from "@/components/history/monthly-recap";
export const metadata: Metadata = { title: "Monthly recap" };
export default async function RecapPage({ params }: { params: Promise<{ month: string }> }) {
  const { month } = await params;
  if (!/^\d{4}-\d{2}$/.test(month)) notFound();
  return <MonthlyRecap month={month} />;
}
