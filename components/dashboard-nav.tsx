"use client";

import { useState } from "react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { Loader2, type LucideIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  activeNavHref,
  getDashboardIcon,
  type DashboardNavItem,
} from "@/components/dashboard-nav-items";

/** Swaps the item's icon for a spinner while the router fetches that page. */
function NavIcon({ icon: Icon }: { icon: LucideIcon }) {
  const { pending } = useLinkStatus();
  if (pending) {
    return <Loader2 data-icon="inline-start" className="animate-spin" />;
  }
  return <Icon data-icon="inline-start" />;
}

/**
 * The sidebar links, desktop and mobile.
 *
 * Every dashboard page is a dynamic server render, so a tab switch always costs
 * a round-trip. Nothing here makes that round-trip shorter — it makes it
 * *legible*: the clicked item takes the selected style immediately (`clicked`
 * wins over the real pathname until the router lands) and shows a spinner in
 * place of its icon, so the click registers at once instead of looking like the
 * app ignored it.
 */
export function DashboardNav({
  navItems,
  className,
  onNavigate,
}: {
  navItems: DashboardNavItem[];
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [clicked, setClicked] = useState<string | null>(null);
  const [lastPathname, setLastPathname] = useState(pathname);

  // Once the navigation lands the real pathname is authoritative again. This
  // also clears the optimistic state if the router sent the user somewhere
  // else (a redirect to /login, say) rather than leaving the wrong tab lit.
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setClicked(null);
  }

  const active = clicked ?? activeNavHref(navItems, pathname);

  return (
    <nav className={cn("flex flex-1 flex-col gap-1 px-3", className)}>
      {navItems.map((item) => {
        const isActive = active === item.href;
        return (
          <Link
            key={item.href}
            data-slot="button"
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            onClick={() => {
              setClicked(item.href);
              onNavigate?.();
            }}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "justify-start hover:bg-clay/10 hover:text-clay-deep",
              isActive && "bg-clay/10 font-medium text-clay-deep",
            )}
            /**
             * These are dynamic routes, so the default prefetch stops at the
             * `loading.tsx` boundary — enough to show a skeleton instantly, but
             * the queries still only start on click. A full prefetch warms the
             * data too, so switching tabs renders from the router cache instead
             * of waiting on the round-trip that made the dashboard feel slow.
             * There are only a handful of tabs, and `staleTimes.dynamic` keeps
             * them from refetching.
             */
            prefetch
          >
            <NavIcon icon={getDashboardIcon(item.iconName)} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
