import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const heading = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Absolute origin for metadata. An env var that exists but is empty (easy to
 * do in the Vercel UI) must not crash the build, so blank and malformed values
 * fall through to VERCEL_URL and then localhost.
 */
function siteOrigin(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ];
  for (const raw of candidates) {
    const v = raw?.trim().replace(/^["']|["']$/g, "");
    if (!v) continue;
    try {
      return new URL(/^https?:\/\//.test(v) ? v : `https://${v}`).origin;
    } catch {
      /* try the next candidate */
    }
  }
  return "http://localhost:3000";
}

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: {
    default: "Skillhive — Find CEU trainings for therapists",
    template: "%s · Skillhive",
  },
  description:
    "Search a clean, modern directory of CEU and professional trainings for licensed mental health therapists — by topic, format, state, price, and accreditation.",
  openGraph: {
    type: "website",
    siteName: "Skillhive",
    title: "Skillhive — Find CEU trainings for therapists",
    description:
      "Search a clean, modern directory of professional courses and trainings.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${heading.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <TooltipProvider delay={200}>{children}</TooltipProvider>
        <Toaster richColors position="top-center" />
        <Analytics />
      </body>
    </html>
  );
}
