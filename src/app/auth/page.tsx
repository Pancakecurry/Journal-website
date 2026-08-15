import { Suspense } from "react";
import { AuthExperience } from "@/components/auth/auth-experience";
import { getRemoteConfiguration } from "@/config/env";

export default function AuthPage() {
  const configured = getRemoteConfiguration().configured;
  return (
    <Suspense fallback={<p>Opening the lock screen…</p>}>
      <AuthExperience configured={configured} />
    </Suspense>
  );
}
