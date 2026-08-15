import type { Metadata } from "next";
import { ExportCenter } from "@/components/privacy/export-center";
export const metadata: Metadata = { title: "Export" };
export default function ExportPage() {
  return <ExportCenter />;
}
