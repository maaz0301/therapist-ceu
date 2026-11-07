import { Link } from "@react-email/components";

import {
  EmailLayout,
  Section,
  Text,
  emailButton,
  emailStyles,
} from "./layout";

export type AlertCourse = { title: string; url: string; schedule: string };

export function SearchAlertEmail({
  query,
  courses,
  savedUrl,
}: {
  query: string;
  courses: AlertCourse[];
  savedUrl: string;
}) {
  return (
    <EmailLayout preview={`New courses matching "${query}"`}>
      <Text style={emailStyles.heading}>New courses for &ldquo;{query}&rdquo;</Text>
      <Text style={emailStyles.paragraph}>
        {courses.length === 1
          ? "A new course matches your alert:"
          : `${courses.length} new courses match your alert:`}
      </Text>
      {courses.map((c) => (
        <Text key={c.url} style={emailStyles.paragraph}>
          <Link href={c.url}>{c.title}</Link>
          <br />
          {c.schedule}
        </Text>
      ))}
      <Section style={emailStyles.ctaSection}>
        <Link href={savedUrl} style={emailButton}>
          Manage your alerts
        </Link>
      </Section>
    </EmailLayout>
  );
}

export default SearchAlertEmail;
