import type { Metadata } from "next";
import { StorageCenter } from "@/components/pwa/install-storage-center";
export const metadata: Metadata = { title: "Storage" };
export default function StoragePage() {
  return <StorageCenter />;
}
