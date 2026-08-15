"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";
import { LOCAL_FOUNDATION_USER_ID, setActiveJournalUserId } from "@/lib/journal-session";
import { usePathname, useRouter } from "next/navigation";
import { getApplicationDatabase } from "@/infrastructure/local/database";

interface JournalIdentity {
  configured: boolean;
  loading: boolean;
  userId: string | null;
}

const JournalIdentityContext = createContext<JournalIdentity>({
  configured: false,
  loading: false,
  userId: LOCAL_FOUNDATION_USER_ID,
});

export function JournalIdentityProvider({
  children,
  remoteConfigured,
}: {
  children: ReactNode;
  remoteConfigured: boolean;
}) {
  const router = useRouter();
  const [identity, setIdentity] = useState<JournalIdentity>(() => ({
    configured: remoteConfigured,
    loading: remoteConfigured,
    userId: remoteConfigured ? null : LOCAL_FOUNDATION_USER_ID,
  }));

  if (!remoteConfigured) setActiveJournalUserId(null, true);

  useEffect(() => {
    if (!remoteConfigured) return;
    const client = createSupabaseBrowserClient();
    if (!client) return;
    let alive = true;
    void client.auth.getUser().then(({ data }) => {
      if (alive) {
        setActiveJournalUserId(data.user?.id ?? null);
        setIdentity({ configured: true, loading: false, userId: data.user?.id ?? null });
      }
    });
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      setActiveJournalUserId(session?.user.id ?? null);
      setIdentity({ configured: true, loading: false, userId: session?.user.id ?? null });
      if (!session && window.location.pathname !== "/auth") {
        router.push("/auth");
        router.refresh();
      }
    });
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, [remoteConfigured, router]);

  const value = useMemo(() => identity, [identity]);
  return (
    <JournalIdentityContext.Provider value={value}>{children}</JournalIdentityContext.Provider>
  );
}

export function AuthenticatedJournalGate({ children }: { children: ReactNode }) {
  const identity = useContext(JournalIdentityContext);
  const router = useRouter();
  const pathname = usePathname();
  const [checkingFirstRun, setCheckingFirstRun] = useState(identity.configured);
  useEffect(() => {
    if (!identity.configured || !identity.userId) {
      window.setTimeout(() => setCheckingFirstRun(false), 0);
      return;
    }
    let alive = true;
    void getApplicationDatabase()
      .preferences.get(identity.userId)
      .then((preferences) => {
        if (!alive) return;
        if (!preferences?.onboardingComplete && pathname !== "/onboarding")
          router.replace("/onboarding");
        setCheckingFirstRun(false);
      });
    return () => {
      alive = false;
    };
  }, [identity.configured, identity.userId, pathname, router]);
  if (identity.loading || checkingFirstRun)
    return (
      <main id="main-content" className="identity-loading" aria-busy="true">
        <p>Opening your private notebook…</p>
      </main>
    );
  if (identity.configured && !identity.userId)
    return (
      <main id="main-content" className="identity-loading">
        <p>Your session has ended. Returning to the lock screen…</p>
      </main>
    );
  return children;
}

export function useJournalIdentity(): JournalIdentity {
  return useContext(JournalIdentityContext);
}

export function useJournalUserId(): string {
  const { userId } = useJournalIdentity();
  if (!userId) throw new Error("Journal identity is not ready");
  return userId;
}
