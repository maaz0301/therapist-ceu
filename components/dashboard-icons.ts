import {
  LayoutDashboard,
  ListChecks,
  BarChart3,
  CreditCard,
  ClipboardCheck,
  Users,
  Tags,
  Settings,
} from "lucide-react";

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
    case "settings":
      return Settings;
    case "tags":
      return Tags;
    default:
      return LayoutDashboard;
  }
}
