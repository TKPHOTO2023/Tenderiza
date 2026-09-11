import type { Metadata } from "next";
import { Archivo, Public_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Display: monumental grotesque for headlines set in caps — signage, not editorial.
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-display",
  display: "swap",
});

// Body: the US government design system's typeface — institutional and plain by design.
const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

// Data: every bid number, closing date and countdown is set in mono, like a register.
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tenderiza — South African Government Tenders & RFQs",
  description:
    "Live RFQs, RFPs and RFIs from National Treasury's eTenders portal, matched to your company profile, with AI-drafted bid documents and a human review gate.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full antialiased ${archivo.variable} ${publicSans.variable} ${plexMono.variable}`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
