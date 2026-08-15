import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell/app-shell";
import { AuthenticatedJournalGate } from "@/components/auth/journal-identity";

export default function ProductLayout({ children }: { children: ReactNode }) {
  return (
    <AuthenticatedJournalGate>
      <AppShell>{children}</AppShell>
    </AuthenticatedJournalGate>
  );
}
