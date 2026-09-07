import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tenderiza — SA Tender Automation",
  description: "Company profile onboarding and compliance document management for South African government tender readiness.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
