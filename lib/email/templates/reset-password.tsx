import { Link } from "@react-email/components";

import {
  EmailLayout,
  Section,
  Text,
  emailButton,
  emailStyles,
} from "./layout";

export function ResetPasswordEmail({
  resetUrl,
}: {
  resetUrl: string;
}) {
  return (
    <EmailLayout preview="Reset your TherapistCEU password">
      <Text style={emailStyles.heading}>
        Reset your password 🔒
      </Text>
      <Text style={emailStyles.paragraph}>
        We received a request to reset the password for your TherapistCEU account. Click the button below to choose a new password:
      </Text>
      <Section style={emailStyles.ctaSection}>
        <Link href={resetUrl} style={emailButton}>
          Reset password
        </Link>
      </Section>
      <Text style={emailStyles.muted}>
        If you didn&apos;t ask to reset your password, you can safely ignore this email — your account remains secure.
      </Text>
      <Text style={emailStyles.muted}>
        Questions? Just reply to this email — we&apos;re happy to help.
      </Text>
    </EmailLayout>
  );
}

export default ResetPasswordEmail;
