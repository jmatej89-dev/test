import type { Metadata } from "next";
import "./globals.css";
import { getSettings, siteUrl } from "@/lib/settings";

export function generateMetadata(): Metadata {
  const s = getSettings();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: s.site_name, template: `%s · ${s.site_name}` },
    description: s.tagline,
    icons: { icon: "/favicon.svg" },
    openGraph: { siteName: s.site_name, type: "website", locale: "cs_CZ" },
    alternates: { types: { "application/rss+xml": "/rss.xml" } },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
