import type { Metadata } from "next";
import { Suspense } from "react";
import { ReflectionFlow } from "@/components/reflection/reflection-flow";

export const metadata: Metadata = { title: "Reflection" };
export default function ReflectionPage() {
  return (
    <Suspense fallback={<p>Opening a quiet page…</p>}>
      <ReflectionFlow />
    </Suspense>
  );
}
