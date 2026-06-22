import { Link } from "@react-email/components";

import {
  EmailLayout,
  Section,
  Text,
  emailButton,
  emailStyles,
} from "./layout";

export function WelcomeEmail({
  name,
  dashboardUrl,
}: {
  name?: string | null;
  dashboardUrl: string;
}) {
  const firstName = name?.split(" ")[0];

  return (
    <EmailLayout preview="Welcome to TherapistCEU — let's get your trainings in front of therapists.">
      <Text style={emailStyles.heading}>
        Welcome{firstName ? `, ${firstName}` : ""}!
      </Text>
      <Text style={emailStyles.paragraph}>
        Thanks for joining TherapistCEU. You can now create listings for your
        CEU and professional trainings and reach therapists who are actively
        searching for continuing education.
      </Text>
      <Text style={emailStyles.paragraph}>
        Here&apos;s how to get started:
      </Text>
      <Text style={emailStyles.muted}>
        1. Create your first listing with dates, format, price, and CE details.
        <br />
        2. Our team reviews it (usually within a day).
        <br />
        3. Once approved, it goes live in the public directory.
      </Text>
      <Section style={emailStyles.ctaSection}>
        <Link href={dashboardUrl} style={emailButton}>
          Go to your dashboard
        </Link>
      </Section>
      <Text style={emailStyles.muted}>
        Questions? Just reply to this email — we&apos;re happy to help.
      </Text>
    </EmailLayout>
  );
}

export default WelcomeEmail;
