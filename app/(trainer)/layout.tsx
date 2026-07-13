import { DashboardShell, type DashboardNavItem } from "@/components/dashboard-shell";
import { requireTrainer } from "@/lib/auth";

const TRAINER_NAV: DashboardNavItem[] = [
  { href: "/dashboard", label: "Dashboard", iconName: "dashboard" },
  { href: "/listings", label: "My listings", iconName: "listings" },
  { href: "/analytics", label: "Analytics", iconName: "analytics" },
  { href: "/billing", label: "Billing", iconName: "billing" },
];

export default async function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireTrainer();

  return (
    <DashboardShell
      areaLabel="Trainer portal"
      navItems={TRAINER_NAV}
      account={{
        name: profile.fullName ?? "Trainer",
        email: profile.contactEmail ?? "",
      }}
    >
      {children}
    </DashboardShell>
  );
}
