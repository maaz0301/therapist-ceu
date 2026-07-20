import { Link } from "@react-email/components";

import {
  EmailLayout,
  Section,
  Text,
  emailButton,
  emailStyles,
} from "./layout";

export function TrainerInviteEmail({
  name,
  inviteUrl,
}: {
  name?: string | null;
  inviteUrl: string;
}) {
  const firstName = name?.split(" ")[0];

  return (
    <EmailLayout preview="You've been invited to list your trainings on TherapistCEU.">
      <Text style={emailStyles.heading}>
        You&apos;re invited{firstName ? `, ${firstName}` : ""}!
      </Text>
      <Text style={emailStyles.paragraph}>
        The TherapistCEU team has set up a trainer account for you. Accept the
        invitation to choose a password, then you can start listing your CEU and
        professional trainings for therapists who are actively searching for
        continuing education.
      </Text>
      <Section style={emailStyles.ctaSection}>
        <Link href={inviteUrl} style={emailButton}>
          Accept invitation
        </Link>
      </Section>
      <Text style={emailStyles.muted}>
        This invitation link expires in 24 hours and can only be used once. If
        it stops working, ask us to send a fresh invite.
      </Text>
      <Text style={emailStyles.muted}>
        Questions? Just reply to this email — we&apos;re happy to help.
      </Text>
    </EmailLayout>
  );
}

export default TrainerInviteEmail;
