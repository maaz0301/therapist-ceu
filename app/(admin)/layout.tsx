import { DashboardShell, type DashboardNavItem } from "@/components/dashboard-shell";
import { requireAdmin } from "@/lib/auth";

const ADMIN_NAV: DashboardNavItem[] = [
  { href: "/admin", label: "Listings", iconName: "admin-listings" },
  { href: "/admin/trainers", label: "Trainers", iconName: "trainers" },
  { href: "/admin/tags", label: "Tags", iconName: "tags" },
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
