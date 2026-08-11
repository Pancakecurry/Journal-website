import type { Metadata } from "next";
import { FoundationScreen } from "@/components/foundation/foundation-screen";

export const metadata: Metadata = { title: "My World" };

export default function MyWorldPage() {
  return (
    <FoundationScreen
      intensity="desk"
      label="My World · desk"
      title="Beautifully prepared. Not yet inhabited."
      description="This space will become personal through your photographs, bookmarks, keepsakes, and choices—not through an unlock economy."
      emptyTitle="A clean beginning"
      emptyDescription="A new journal should feel intentional and sparse. The desk will gain meaningful traces only through real use."
    />
  );
}
