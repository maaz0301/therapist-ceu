"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  filtersToQueryString,
  type DirectoryFilters,
} from "@/lib/directory-params";

/** Shared helper for directory controls to push filter changes into the URL. */
export function useFilterNav(filters: DirectoryFilters) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function apply(next: DirectoryFilters) {
    const qs = filtersToQueryString(next);
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  function update(partial: Partial<DirectoryFilters>) {
    // Any filter change resets to page 1 unless a page is explicitly provided.
    apply({ ...filters, ...partial, page: partial.page ?? 1 });
  }

  return { update, apply, isPending };
}
