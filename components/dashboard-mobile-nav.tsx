"use client";

import { Menu, LogOut } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Sheet, SheetTrigger, SheetContent, SheetHeader } from "@/components/ui/sheet";
import { signOutAction } from "@/lib/actions/auth";
import {
  getDashboardIcon,
  type DashboardNavItem,
  type DashboardAccount,
} from "@/components/dashboard-shell";

export function DashboardMobileNav({
  areaLabel,
  navItems,
  account,
}: {
  areaLabel: string;
  navItems: DashboardNavItem[];
  account?: DashboardAccount;
}) {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden mr-2" aria-label="Open navigation menu" />}>
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-60 p-0 flex flex-col h-full bg-sidebar border-r border-border">
        <SheetHeader className="flex h-16 items-center border-b border-border px-5 py-0 flex-row">
          <Logo />
        </SheetHeader>
        <div className="px-3 py-2">
          <span className="px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {areaLabel}
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {navItems.map((item) => {
            const Icon = getDashboardIcon(item.iconName);
            return (
              <ButtonLink
                key={item.href}
                variant="ghost"
                size="sm"
                className="justify-start hover:bg-primary/10 hover:text-primary"
                href={item.href}
              >
                <Icon data-icon="inline-start" className="mr-2 size-4" />
                {item.label}
              </ButtonLink>
            );
          })}
        </nav>
        <div className="flex flex-col gap-1 border-t border-border p-3 mt-auto bg-card">
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
            className="w-full justify-start text-muted-foreground hover:bg-primary/10 hover:text-primary"
            href="/"
          >
            Back to site
          </ButtonLink>
          <form action={signOutAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground hover:bg-primary/10 hover:text-primary"
            >
              <LogOut data-icon="inline-start" className="mr-2 size-4" />
              Log out
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
