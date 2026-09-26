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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400;1,6..72,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
