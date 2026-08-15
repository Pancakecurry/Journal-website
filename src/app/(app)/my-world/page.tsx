import type { Metadata } from "next";
import { MyWorldExperience } from "@/components/personal-world/my-world-experience";

export const metadata: Metadata = { title: "My World" };

export default function MyWorldPage() {
  return <MyWorldExperience />;
}
