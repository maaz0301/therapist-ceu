import { Link } from "@react-email/components";

import {
  EmailLayout,
  Section,
  Text,
  emailButton,
  emailStyles,
} from "./layout";

export function AccountDeactivatedEmail({
  name,
  billingUrl,
}: {
  name?: string | null;
  billingUrl: string;
}) {
  const firstName = name?.split(" ")[0];

  return (
    <EmailLayout preview="Your TherapistCEU listings have been deactivated">
      <Text style={emailStyles.heading}>Your listings have been deactivated ⏸️</Text>
      <Text style={emailStyles.paragraph}>
        Hi{firstName ? ` ${firstName}` : ""}, your subscription has lapsed, so
        your training listings are currently hidden from the public directory.
      </Text>
      <Text style={emailStyles.warningBox}>
        Your listings have not been deleted — resubscribe anytime to instantly reactivate them.
      </Text>
      <Section style={emailStyles.ctaSection}>
        <Link href={billingUrl} style={emailButton}>
          Reactivate listings
        </Link>
      </Section>
      <Text style={emailStyles.muted}>
        Questions? Just reply to this email — we&apos;re happy to help.
      </Text>
    </EmailLayout>
  );
}

export default AccountDeactivatedEmail;
