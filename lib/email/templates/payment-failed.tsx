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
      <Text style={emailStyles.heading}>Payment update required ⚠️</Text>
      <Text style={emailStyles.paragraph}>
        Hi{firstName ? ` ${firstName}` : ""}, your recent subscription
        payment for TherapistCEU could not be processed.
      </Text>
      <Text style={emailStyles.alertBox}>
        Please update your payment method to keep your training listings live and active in the directory.
      </Text>
      <Text style={emailStyles.muted}>
        If your payment details are not updated, your listings will be automatically
        deactivated when your grace period ends.
      </Text>
      <Section style={emailStyles.ctaSection}>
        <Link href={billingUrl} style={emailButton}>
          Update billing details
        </Link>
      </Section>
      <Text style={emailStyles.muted}>
        Questions? Just reply to this email — we&apos;re happy to help.
      </Text>
    </EmailLayout>
  );
}

export default PaymentFailedEmail;
