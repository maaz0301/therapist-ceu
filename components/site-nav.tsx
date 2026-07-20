"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { ButtonLink } from "@/components/ui/button-link";

const NAV_LINKS = [
  { href: "/directory", label: "Browse trainings" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#for-trainers", label: "For trainers" },
];

function subscribeToHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
  };
}

const getHash = () => window.location.hash;
const getServerHash = () => "";

export function SiteNav() {
  const pathname = usePathname();

  /**
   * The hash isn't part of `usePathname`, and an App Router <Link> navigation
   * to a hash on another route doesn't reliably fire `hashchange` — so an
   * effect that only listens for that event goes stale. Reading through
   * useSyncExternalStore re-checks on every render, which includes the
   * re-render `usePathname` triggers on navigation.
   */
  const hash = useSyncExternalStore(subscribeToHash, getHash, getServerHash);

  return (
    <nav className="hidden items-center gap-1 md:flex">
      {NAV_LINKS.map((link) => {
        let isActive = false;

        if (link.href.includes("#")) {
          const [path, linkHash] = link.href.split("#");
          isActive = pathname === path && hash === `#${linkHash}`;
        } else {
          isActive = pathname.startsWith(link.href);
        }

        return (
          <ButtonLink
            key={link.href}
            variant="ghost"
            size="sm"
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            // `secondary` (#EDEFE8) sits ~2% off the header background
            // (#F7F8F5), so the active tab read as unstyled — and ghost's
            // hover state (--muted) is darker, making an inactive hovered tab
            // look *more* selected. A clay tint plus weight is unambiguous
            // against both, and the underline carries the state for anyone
            // who can't distinguish the hue.
            className={
              isActive
                ? "bg-clay/10 font-semibold text-clay-deep underline decoration-2 underline-offset-[6px] hover:bg-clay/15 dark:text-clay"
                : undefined
            }
          >
            {link.label}
          </ButtonLink>
        );
      })}
    </nav>
  );
}
