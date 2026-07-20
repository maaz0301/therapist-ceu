"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { ButtonLink } from "@/components/ui/button-link";

const NAV_LINKS = [
  { href: "/directory", label: "Browse trainings" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#for-trainers", label: "For trainers" },
];

const LOCATION_CHANGE = "sitenav:locationchange";

/**
 * The App Router navigates with history.pushState, which fires neither
 * `hashchange` nor `popstate`. Clicking "/#for-trainers" from the same page
 * therefore changes the URL with no event and no re-render — pathname is
 * unchanged, so nothing tells the nav to re-read the hash.
 *
 * Patch the two history methods once to emit an event we can subscribe to.
 * Idempotent, and left in place for the page's lifetime: other subscribers
 * may still depend on it, and restoring the originals could clobber another
 * patch applied after ours.
 */
let historyPatched = false;
function patchHistory() {
  if (historyPatched || typeof window === "undefined") return;
  historyPatched = true;
  for (const method of ["pushState", "replaceState"] as const) {
    const original = window.history[method];
    window.history[method] = function patched(
      this: History,
      ...args: Parameters<History["pushState"]>
    ) {
      const result = original.apply(this, args);
      window.dispatchEvent(new Event(LOCATION_CHANGE));
      return result;
    };
  }
}

function subscribeToHash(onChange: () => void) {
  patchHistory();
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  window.addEventListener(LOCATION_CHANGE, onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(LOCATION_CHANGE, onChange);
  };
}

const getHash = () => window.location.hash;
const getServerHash = () => "";

export function SiteNav() {
  const pathname = usePathname();

  // The hash isn't part of `usePathname`, so it needs its own subscription —
  // see patchHistory above for why the built-in events aren't enough.
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
