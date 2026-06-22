import { ClipboardCheck, Users, Tags } from "lucide-react";

import { DashboardShell, type DashboardNavItem } from "@/components/dashboard-shell";
import { requireAdmin } from "@/lib/auth";

const ADMIN_NAV: DashboardNavItem[] = [
  { href: "/admin", label: "Listings", icon: ClipboardCheck },
  { href: "/admin/trainers", label: "Trainers", icon: Users },
  { href: "/admin/tags", label: "Tags", icon: Tags },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAdmin();

  return (
    <DashboardShell
      areaLabel="Admin"
      navItems={ADMIN_NAV}
      account={{
        name: profile.fullName ?? "Admin",
        email: profile.contactEmail ?? "",
      }}
    >
      {children}
    </DashboardShell>
  );
}
