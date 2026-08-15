import type { Metadata } from "next";
import { OnboardingExperience } from "@/components/auth/onboarding-experience";
export const metadata: Metadata = { title: "Set up your notebook" };
export default function OnboardingPage() {
  return <OnboardingExperience />;
}
