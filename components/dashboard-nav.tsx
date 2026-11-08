"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { getDashboardIcon } from "@/components/dashboard-icons";
import type { DashboardNavItem } from "@/components/dashboard-shell";
import { cn } from "@/lib/utils";

/** Sidebar links with the current section highlighted. */
export function DashboardNav({ navItems }: { navItems: DashboardNavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1.5 px-3">
      {navItems.map((item) => {
        const Icon = getDashboardIcon(item.iconName);
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && item.href !== "/admin" && pathname.startsWith(item.href + "/"));
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all",
              active
                ? "border-foreground bg-primary text-primary-foreground shadow-[3px_3px_0_0_var(--foreground)]"
                : "border-transparent text-muted-foreground hover:border-foreground/30 hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
