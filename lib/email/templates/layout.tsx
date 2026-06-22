import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

const COLORS = {
  bg: "#f1f5f6",
  card: "#ffffff",
  border: "#e2e8f0",
  text: "#0f172a",
  muted: "#64748b",
  primary: "#0d9488",
};

export const emailButton = {
  display: "inline-block",
  backgroundColor: COLORS.primary,
  color: "#ffffff",
  fontWeight: 600,
  fontSize: "15px",
  textDecoration: "none",
  padding: "12px 22px",
  borderRadius: "10px",
};

const main = {
  backgroundColor: COLORS.bg,
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  margin: 0,
  padding: "32px 0",
};

const container = {
  backgroundColor: COLORS.card,
  border: `1px solid ${COLORS.border}`,
  borderRadius: "14px",
  maxWidth: "520px",
  margin: "0 auto",
  padding: "32px",
};

const brand = {
  fontSize: "20px",
  fontWeight: 700,
  color: COLORS.text,
  margin: "0 0 24px",
};

const brandAccent = { color: COLORS.primary };

const footer = {
  fontSize: "12px",
  color: COLORS.muted,
  lineHeight: "18px",
  margin: "4px 0 0",
};

export function EmailLayout({
  preview,
  children,
}: {
  preview: string;
  children: ReactNode;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://therapistceu.com";

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>
            Therapist<span style={brandAccent}>CEU</span>
          </Text>
          {children}
          <Hr
            style={{
              borderColor: COLORS.border,
              margin: "28px 0 16px",
            }}
          />
          <Text style={footer}>
            TherapistCEU.com — the directory of CEU &amp; professional trainings
            for licensed mental health therapists.
          </Text>
          <Text style={footer}>
            <Link href={appUrl} style={{ color: COLORS.muted }}>
              {appUrl.replace(/^https?:\/\//, "")}
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const emailStyles = {
  heading: {
    fontSize: "22px",
    fontWeight: 700,
    color: COLORS.text,
    margin: "0 0 12px",
  },
  paragraph: {
    fontSize: "15px",
    lineHeight: "24px",
    color: COLORS.text,
    margin: "0 0 16px",
  },
  muted: {
    fontSize: "14px",
    lineHeight: "22px",
    color: COLORS.muted,
    margin: "0 0 16px",
  },
  ctaSection: { margin: "8px 0 24px" } as const,
  quote: {
    fontSize: "15px",
    lineHeight: "23px",
    color: COLORS.text,
    backgroundColor: "#f8fafc",
    borderLeft: `3px solid ${COLORS.border}`,
    borderRadius: "6px",
    padding: "12px 16px",
    margin: "0 0 20px",
  },
};

export { Section, Text };
