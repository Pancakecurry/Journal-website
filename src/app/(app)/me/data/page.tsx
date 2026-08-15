import type { Metadata } from "next";
import { DataControls } from "@/components/privacy/data-controls";
export const metadata: Metadata = { title: "Data controls" };
export default function DataPage() {
  return <DataControls />;
}
