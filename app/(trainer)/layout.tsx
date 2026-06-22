import {
  LayoutDashboard,
  ListChecks,
  BarChart3,
  CreditCard,
} from "lucide-react";

import { DashboardShell, type DashboardNavItem } from "@/components/dashboard-shell";
import { requireTrainer } from "@/lib/auth";

const TRAINER_NAV: DashboardNavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/listings", label: "My listings", icon: ListChecks },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/billing", label: "Billing", icon: CreditCard },
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
