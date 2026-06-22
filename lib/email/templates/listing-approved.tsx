import { Link } from "@react-email/components";

import {
  EmailLayout,
  Section,
  Text,
  emailButton,
  emailStyles,
} from "./layout";

export function ListingApprovedEmail({
  name,
  listingTitle,
  listingUrl,
}: {
  name?: string | null;
  listingTitle: string;
  listingUrl: string;
}) {
  const firstName = name?.split(" ")[0];

  return (
    <EmailLayout preview={`Your listing is live: ${listingTitle}`}>
      <Text style={emailStyles.heading}>Your listing is approved 🎉</Text>
      <Text style={emailStyles.paragraph}>
        Great news{firstName ? `, ${firstName}` : ""} — your training has been
        approved and is now live in the TherapistCEU directory.
      </Text>
      <Text style={emailStyles.quote}>{listingTitle}</Text>
      <Text style={emailStyles.muted}>
        Therapists can now find it when they search and filter. You can track
        views and registration clicks anytime from your analytics dashboard.
      </Text>
      <Section style={emailStyles.ctaSection}>
        <Link href={listingUrl} style={emailButton}>
          View your live listing
        </Link>
      </Section>
    </EmailLayout>
  );
}

export default ListingApprovedEmail;
