import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { DesignSystemProvider } from "@/design-system/design-system-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Campus Atelier Journal", template: "%s · Campus Atelier" },
  description: "A private, Day-centered journaling environment.",
  applicationName: "Campus Atelier Journal",
};

export const viewport: Viewport = { themeColor: "#fbf7eb", colorScheme: "light" };

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <DesignSystemProvider>{children}</DesignSystemProvider>
      </body>
    </html>
  );
}
