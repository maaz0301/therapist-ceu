import { Link } from "@react-email/components";

import {
  EmailLayout,
  Section,
  Text,
  emailButton,
  emailStyles,
} from "./layout";

export function PaymentFailedEmail({
  name,
  billingUrl,
}: {
  name?: string | null;
  billingUrl: string;
}) {
  const firstName = name?.split(" ")[0];

  return (
    <EmailLayout preview="We couldn't process your TherapistCEU payment">
      <Text style={emailStyles.heading}>We couldn&apos;t process your payment</Text>
      <Text style={emailStyles.paragraph}>
        Hi{firstName ? ` ${firstName}` : ""}, your most recent subscription
        payment for TherapistCEU didn&apos;t go through. Please update your
        billing details to keep your listings live.
      </Text>
      <Text style={emailStyles.muted}>
        If this isn&apos;t resolved, your listings will be automatically
        deactivated when your subscription lapses.
      </Text>
      <Section style={emailStyles.ctaSection}>
        <Link href={billingUrl} style={emailButton}>
          Update billing details
        </Link>
      </Section>
    </EmailLayout>
  );
}

export default PaymentFailedEmail;
