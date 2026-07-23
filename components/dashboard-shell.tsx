import { LogOut } from "lucide-react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { signOutAction } from "@/lib/actions/auth";
import { DashboardMobileNav } from "@/components/dashboard-mobile-nav";
import { DashboardNav } from "@/components/dashboard-nav";
import type {
  DashboardAccount,
  DashboardNavItem,
} from "@/components/dashboard-nav-items";

export { getDashboardIcon } from "@/components/dashboard-nav-items";
export type {
  DashboardAccount,
  DashboardNavItem,
} from "@/components/dashboard-nav-items";

export function DashboardShell({
  areaLabel,
  navItems,
  account,
  children,
}: {
  areaLabel: string;
  navItems: DashboardNavItem[];
  account?: DashboardAccount;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-sidebar md:fixed md:inset-y-0 md:left-0 md:z-20 md:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Logo />
        </div>
        <div className="px-3 py-2">
          <span className="px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {areaLabel}
          </span>
        </div>
        <DashboardNav navItems={navItems} />
        <div className="flex flex-col gap-1 border-t border-border p-3">
          {account ? (
            <div className="px-2 pt-1 pb-2">
              <p className="truncate text-sm font-medium text-foreground">
                {account.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {account.email}
              </p>
            </div>
          ) : null}
          <ButtonLink
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:bg-clay/10 hover:text-clay-deep"
            href="/"
          >
            Back to site
          </ButtonLink>
          <form action={signOutAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground hover:bg-clay/10 hover:text-clay-deep"
            >
              <LogOut data-icon="inline-start" />
              Log out
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col md:pl-60">
        <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 sm:px-6">
          <div className="flex items-center md:hidden">
            <DashboardMobileNav
              areaLabel={areaLabel}
              navItems={navItems}
              account={account}
            />
            <span className="font-heading text-sm font-semibold text-foreground">
              {areaLabel}
            </span>
          </div>
          <div className="md:hidden">
            <Logo />
          </div>
        </header>
        <main className="flex-1 bg-background p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
