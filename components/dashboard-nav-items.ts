import {
  LayoutDashboard,
  ListChecks,
  BarChart3,
  CreditCard,
  ClipboardCheck,
  Users,
  Tags,
} from "lucide-react";

/**
 * Shared shape of the dashboard sidebar. Kept in its own leaf module so the
 * client-side nav can import the icon map without pulling in the server-only
 * shell (and without the shell/nav import cycle that would create).
 */

export type DashboardNavItem = {
  href: string;
  label: string;
  iconName: string;
};

export type DashboardAccount = {
  name: string;
  email: string;
};

export function getDashboardIcon(iconName: string) {
  switch (iconName) {
    case "dashboard":
      return LayoutDashboard;
    case "listings":
      return ListChecks;
    case "analytics":
      return BarChart3;
    case "billing":
      return CreditCard;
    case "admin-listings":
      return ClipboardCheck;
    case "trainers":
      return Users;
    case "tags":
      return Tags;
    default:
      return LayoutDashboard;
  }
}

/**
 * The nav entry a path belongs to, by longest matching href — `/admin` must
 * not claim `/admin/trainers`, but `/listings` should still own
 * `/listings/new` and `/listings/[slug]/edit`.
 */
export function activeNavHref(
  navItems: DashboardNavItem[],
  pathname: string,
): string | null {
  let best: string | null = null;
  for (const { href } of navItems) {
    const matches = pathname === href || pathname.startsWith(`${href}/`);
    if (matches && (best === null || href.length > best.length)) best = href;
  }
  return best;
}
