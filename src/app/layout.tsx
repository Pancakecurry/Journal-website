import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { DesignSystemProvider } from "@/design-system/design-system-provider";
import { JournalIdentityProvider } from "@/components/auth/journal-identity";
import { getRemoteConfiguration } from "@/config/env";
import "./globals.css";
import { PRODUCT_BRAND } from "@/config/brand";

export const metadata: Metadata = {
  title: { default: PRODUCT_BRAND.name, template: "%s · Campus Atelier" },
  description: PRODUCT_BRAND.description,
  applicationName: PRODUCT_BRAND.name,
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/atelier.svg", apple: "/icons/atelier-192.png" },
};

export const viewport: Viewport = { themeColor: "#fbf7eb", colorScheme: "light" };

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const remoteConfigured = getRemoteConfiguration().configured;
  return (
    <html lang="en">
      <body>
        <JournalIdentityProvider remoteConfigured={remoteConfigured}>
          <DesignSystemProvider>{children}</DesignSystemProvider>
        </JournalIdentityProvider>
      </body>
    </html>
  );
}
