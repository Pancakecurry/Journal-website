import type { Metadata } from "next";
import { ImportCenter } from "@/components/privacy/import-center";
export const metadata: Metadata = { title: "Restore" };
export default function ImportPage() {
  return <ImportCenter />;
}
