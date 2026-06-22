import { Link } from "@react-email/components";

import {
  EmailLayout,
  Section,
  Text,
  emailButton,
  emailStyles,
} from "./layout";

export function ListingSubmittedEmail({
  name,
  listingTitle,
  dashboardUrl,
}: {
  name?: string | null;
  listingTitle: string;
  dashboardUrl: string;
}) {
  const firstName = name?.split(" ")[0];

  return (
    <EmailLayout preview={`We received your listing: ${listingTitle}`}>
      <Text style={emailStyles.heading}>Listing submitted for review</Text>
      <Text style={emailStyles.paragraph}>
        Hi{firstName ? ` ${firstName}` : ""}, thanks for submitting your
        training. We&apos;ve received it and our team will review it shortly.
      </Text>
      <Text style={emailStyles.quote}>{listingTitle}</Text>
      <Text style={emailStyles.muted}>
        Most listings are reviewed within one business day. We&apos;ll email you
        as soon as it&apos;s approved and live in the directory.
      </Text>
      <Section style={emailStyles.ctaSection}>
        <Link href={dashboardUrl} style={emailButton}>
          View your listings
        </Link>
      </Section>
    </EmailLayout>
  );
}

export default ListingSubmittedEmail;
