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

/*
 * Mirrors the brand tokens in app/globals.css. Email clients don't support
 * CSS custom properties reliably, so the swatches are duplicated here as
 * literals — keep them in sync with the :root block if the palette moves.
 */
const COLORS = {
  bg: "#F7F8F5", // off-white page background
  card: "#FFFFFF",
  border: "#DCE0D7",
  text: "#374446", // iron grey
  muted: "#5E6E70",
  primary: "#9D6858", // terracotta clay CTA button
  quote: "#EAEDE5",
  successBg: "#E8F3EB",
  successText: "#2D6A3F",
  warningBg: "#FDF4E7",
  warningText: "#A05E03",
  errorBg: "#FDF2F2",
  errorText: "#9B1C1C",
};

export const emailButton = {
  display: "inline-block",
  backgroundColor: COLORS.primary,
  color: "#ffffff",
  fontWeight: 600,
  fontSize: "15px",
  textDecoration: "none",
  padding: "12px 24px",
  borderRadius: "10px",
  textAlign: "center" as const,
};

const main = {
  backgroundColor: COLORS.bg,
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  margin: 0,
  padding: "36px 0",
};

const container = {
  backgroundColor: COLORS.card,
  border: `1px solid ${COLORS.border}`,
  borderRadius: "14px",
  maxWidth: "520px",
  margin: "0 auto",
  padding: "36px 32px",
};

const brand = {
  fontSize: "22px",
  fontWeight: 700,
  color: COLORS.text,
  margin: "0 0 28px",
  letterSpacing: "-0.3px",
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
    letterSpacing: "-0.2px",
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
  ctaSection: { margin: "12px 0 24px" } as const,
  cardBox: {
    fontSize: "15px",
    lineHeight: "23px",
    fontWeight: 600,
    color: COLORS.text,
    backgroundColor: COLORS.quote,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "8px",
    padding: "14px 18px",
    margin: "0 0 20px",
  },
  alertBox: {
    fontSize: "14px",
    lineHeight: "22px",
    color: COLORS.errorText,
    backgroundColor: COLORS.errorBg,
    borderLeft: `4px solid ${COLORS.errorText}`,
    borderRadius: "6px",
    padding: "12px 16px",
    margin: "0 0 20px",
  },
  warningBox: {
    fontSize: "14px",
    lineHeight: "22px",
    color: COLORS.warningText,
    backgroundColor: COLORS.warningBg,
    borderLeft: `4px solid ${COLORS.warningText}`,
    borderRadius: "6px",
    padding: "12px 16px",
    margin: "0 0 20px",
  },
  successBox: {
    fontSize: "14px",
    lineHeight: "22px",
    color: COLORS.successText,
    backgroundColor: COLORS.successBg,
    borderLeft: `4px solid ${COLORS.successText}`,
    borderRadius: "6px",
    padding: "12px 16px",
    margin: "0 0 20px",
  },
};

export { Section, Text };
