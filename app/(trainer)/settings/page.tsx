import Link from "next/link";

import { Card } from "@/components/ui/card";
import { requireTrainer, requireUser } from "@/lib/auth";
import { getSubscriptionState } from "@/lib/subscription";
import {
  DeleteAccountForm,
  NotificationsForm,
  PasswordForm,
  ProfileForm,
  ThemePicker,
} from "./settings-forms";

export const metadata = { title: "Settings" };

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="gap-5 p-6">
      <div>
        <h2 className="font-heading text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </Card>
  );
}

export default async function SettingsPage() {
  const user = await requireUser();
  const profile = await requireTrainer();
  const subscription = getSubscriptionState(profile);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, security and how Skillhive looks for you.
        </p>
      </div>

      <Section
        title="Profile"
        description="Shown on your course pages so learners know who is teaching."
      >
        <ProfileForm
          defaults={{
            fullName: profile.fullName ?? "",
            credentials: profile.credentials ?? "",
            bio: profile.bio ?? "",
            websiteUrl: profile.websiteUrl ?? "",
          }}
        />
      </Section>

      <Section title="Email notifications" description="Choose which emails you receive.">
        <NotificationsForm
          defaults={{ notifyAlerts: profile.notifyAlerts, notifyProduct: profile.notifyProduct }}
        />
      </Section>

      <Section title="Appearance" description="Choose a theme. System follows your device.">
        <ThemePicker />
      </Section>

      <Section title="Password" description="Use a strong password you don't use elsewhere.">
        <PasswordForm />
      </Section>

      <Section title="Account" description="Your sign-in email and plan.">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="mt-0.5 font-medium text-foreground">{user.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Plan</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {subscription.isActive ? (subscription.tier ?? "Active") : "No active plan"}{" "}
              <Link href="/billing" className="text-primary hover:underline">
                Manage billing
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Keyword alerts</dt>
            <dd className="mt-0.5">
              <Link href="/saved" className="text-primary hover:underline">
                Manage saved courses and alerts
              </Link>
            </dd>
          </div>
        </dl>
      </Section>

      <Card className="gap-5 border-destructive/40 p-6">
        <div>
          <h2 className="font-heading text-lg font-semibold text-destructive">Delete account</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Permanently removes your profile, courses, saved items and alerts. This cannot be undone.
          </p>
        </div>
        <DeleteAccountForm />
      </Card>
    </div>
  );
}
