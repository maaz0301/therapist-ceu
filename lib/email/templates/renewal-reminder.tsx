import { Link } from "@react-email/components";

import {
  EmailLayout,
  Section,
  Text,
  emailButton,
  emailStyles,
} from "./layout";

export function RenewalReminderEmail({
  name,
  renewalDate,
  billingUrl,
}: {
  name?: string | null;
  renewalDate: string;
  billingUrl: string;
}) {
  const firstName = name?.split(" ")[0];

  return (
    <EmailLayout preview={`Your TherapistCEU subscription renews on ${renewalDate}`}>
      <Text style={emailStyles.heading}>Your subscription renews soon</Text>
      <Text style={emailStyles.paragraph}>
        Hi{firstName ? ` ${firstName}` : ""}, just a heads-up — your
        TherapistCEU subscription will renew on{" "}
        <strong>{renewalDate}</strong>.
      </Text>
      <Text style={emailStyles.muted}>
        No action needed if everything looks good. You can review or change
        your plan anytime from your billing page.
      </Text>
      <Section style={emailStyles.ctaSection}>
        <Link href={billingUrl} style={emailButton}>
          Manage subscription
        </Link>
      </Section>
    </EmailLayout>
  );
}

export default RenewalReminderEmail;
