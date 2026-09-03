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

export const metadata: Metadata = {
  metadataBase: new URL("https://therapistceu.com"),
  title: {
    default: "TherapistCEU.com — Find CEU trainings for therapists",
    template: "%s · TherapistCEU.com",
  },
  description:
    "Search a clean, modern directory of CEU and professional trainings for licensed mental health therapists — by topic, format, state, price, and accreditation.",
  openGraph: {
    type: "website",
    siteName: "TherapistCEU.com",
    title: "TherapistCEU.com — Find CEU trainings for therapists",
    description:
      "Search a clean, modern directory of CEU and professional trainings for licensed mental health therapists.",
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
