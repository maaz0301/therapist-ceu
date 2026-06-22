import { Link } from "@react-email/components";

import {
  EmailLayout,
  Section,
  Text,
  emailButton,
  emailStyles,
} from "./layout";

export function ListingRejectedEmail({
  name,
  listingTitle,
  reason,
  editUrl,
}: {
  name?: string | null;
  listingTitle: string;
  reason: string;
  editUrl: string;
}) {
  const firstName = name?.split(" ")[0];

  return (
    <EmailLayout preview={`Action needed on your listing: ${listingTitle}`}>
      <Text style={emailStyles.heading}>Your listing needs a few changes</Text>
      <Text style={emailStyles.paragraph}>
        Hi{firstName ? ` ${firstName}` : ""}, thanks for submitting your
        training. Before we can publish it, we need a few adjustments.
      </Text>
      <Text style={emailStyles.quote}>{listingTitle}</Text>
      <Text style={{ ...emailStyles.paragraph, fontWeight: 600 }}>
        What to update:
      </Text>
      <Text style={emailStyles.quote}>{reason}</Text>
      <Text style={emailStyles.muted}>
        Make the changes and resubmit — editing your listing automatically sends
        it back to us for another review.
      </Text>
      <Section style={emailStyles.ctaSection}>
        <Link href={editUrl} style={emailButton}>
          Edit and resubmit
        </Link>
      </Section>
    </EmailLayout>
  );
}

export default ListingRejectedEmail;
