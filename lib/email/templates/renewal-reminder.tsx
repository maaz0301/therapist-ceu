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
      <Text style={emailStyles.heading}>Your subscription renews soon 📅</Text>
      <Text style={emailStyles.paragraph}>
        Hi{firstName ? ` ${firstName}` : ""}, just a quick heads-up that your
        TherapistCEU subscription is scheduled to auto-renew soon.
      </Text>
      <Text style={emailStyles.cardBox}>
        Renewal Date: {renewalDate}
      </Text>
      <Text style={emailStyles.muted}>
        No action is required if everything looks good. You can review your details or modify
        your subscription anytime from your billing page.
      </Text>
      <Section style={emailStyles.ctaSection}>
        <Link href={billingUrl} style={emailButton}>
          Manage subscription
        </Link>
      </Section>
      <Text style={emailStyles.muted}>
        Questions? Just reply to this email — we&apos;re happy to help.
      </Text>
    </EmailLayout>
  );
}

export default RenewalReminderEmail;
