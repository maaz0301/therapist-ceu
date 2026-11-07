import { Link } from "@react-email/components";

import {
  EmailLayout,
  Section,
  Text,
  emailButton,
  emailStyles,
} from "./layout";

export function ConfirmEmail({
  name,
  confirmUrl,
}: {
  name?: string | null;
  confirmUrl: string;
}) {
  const firstName = name?.split(" ")[0];

  return (
    <EmailLayout preview="Confirm your email address for Skillhive">
      <Text style={emailStyles.heading}>
        Confirm your email address ✉️
      </Text>
      <Text style={emailStyles.paragraph}>
        Hi{firstName ? ` ${firstName}` : ""}, thanks for signing up for Skillhive!
        Please confirm your email address to complete your account setup and start listing your trainings.
      </Text>
      <Section style={emailStyles.ctaSection}>
        <Link href={confirmUrl} style={emailButton}>
          Confirm email address
        </Link>
      </Section>
      <Text style={emailStyles.muted}>
        If you didn&apos;t create a Skillhive account, you can safely ignore this email.
      </Text>
      <Text style={emailStyles.muted}>
        Questions? Just reply to this email — we&apos;re happy to help.
      </Text>
    </EmailLayout>
  );
}

export default ConfirmEmail;
