import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Detektivky.cz — Detektivní hry, které přijdou domů",
  description:
    "Fyzická krabice se spisem skutečného či fikčního případu, doplněná online portálem s odposlechy, e-maily a databází podezřelých. Vyřešte vraždu.",
};

// Nonce-based CSP (see src/proxy.ts) requires every page in this layout
// tree to render dynamically so a fresh nonce reaches the response.
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="cs"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100">
        {children}
      </body>
    </html>
  );
}
