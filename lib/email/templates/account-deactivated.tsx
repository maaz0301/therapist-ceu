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
      <Text style={emailStyles.heading}>Your listings have been deactivated</Text>
      <Text style={emailStyles.paragraph}>
        Hi{firstName ? ` ${firstName}` : ""}, your subscription has lapsed, so
        your training listings are no longer visible in the public directory.
      </Text>
      <Text style={emailStyles.muted}>
        Your listings haven&apos;t been deleted — resubscribe anytime and
        they&apos;ll go right back up.
      </Text>
      <Section style={emailStyles.ctaSection}>
        <Link href={billingUrl} style={emailButton}>
          Resubscribe
        </Link>
      </Section>
    </EmailLayout>
  );
}

export default AccountDeactivatedEmail;
