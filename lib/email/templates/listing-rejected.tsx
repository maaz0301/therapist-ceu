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
      <Text style={emailStyles.heading}>Action needed on your listing ✏️</Text>
      <Text style={emailStyles.paragraph}>
        Hi{firstName ? ` ${firstName}` : ""}, thanks for submitting your
        training. Before we can publish it, a few quick adjustments are needed:
      </Text>
      <Text style={emailStyles.cardBox}>{listingTitle}</Text>
      <Text style={{ ...emailStyles.paragraph, fontWeight: 600, marginBottom: "8px" }}>
        Feedback from our team:
      </Text>
      <Text style={emailStyles.warningBox}>{reason}</Text>
      <Text style={emailStyles.muted}>
        Make the required updates and resubmit — saving your edits automatically sends
        the listing back to our team for a fast review.
      </Text>
      <Section style={emailStyles.ctaSection}>
        <Link href={editUrl} style={emailButton}>
          Edit &amp; resubmit listing
        </Link>
      </Section>
      <Text style={emailStyles.muted}>
        Questions? Just reply to this email — we&apos;re happy to help.
      </Text>
    </EmailLayout>
  );
}

export default ListingRejectedEmail;
