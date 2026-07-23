import { Link } from "@react-email/components";

import {
  EmailLayout,
  Section,
  Text,
  emailButton,
  emailStyles,
} from "./layout";

export function MagicLinkEmail({
  magicLinkUrl,
}: {
  magicLinkUrl: string;
}) {
  return (
    <EmailLayout preview="Your magic login link for TherapistCEU">
      <Text style={emailStyles.heading}>
        Your login link 🪄
      </Text>
      <Text style={emailStyles.paragraph}>
        Click the button below to log in to your TherapistCEU account without entering a password.
      </Text>
      <Section style={emailStyles.ctaSection}>
        <Link href={magicLinkUrl} style={emailButton}>
          Log in to TherapistCEU
        </Link>
      </Section>
      <Text style={emailStyles.muted}>
        This link is single-use and will expire shortly. If you did not request a magic login link, you can safely ignore this email.
      </Text>
      <Text style={emailStyles.muted}>
        Questions? Just reply to this email — we&apos;re happy to help.
      </Text>
    </EmailLayout>
  );
}

export default MagicLinkEmail;
