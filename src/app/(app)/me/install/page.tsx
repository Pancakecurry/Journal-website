import type { Metadata } from "next";
import { InstallCenter } from "@/components/pwa/install-storage-center";
export const metadata: Metadata = { title: "Install" };
export default function InstallPage() {
  return <InstallCenter />;
}
