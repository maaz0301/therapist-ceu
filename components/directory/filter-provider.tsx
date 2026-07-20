"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  filtersToQueryString,
  type DirectoryFilters,
} from "@/lib/directory-params";

type FilterContextValue = {
  /** Filters to render controls from — updates instantly on interaction. */
  filters: DirectoryFilters;
  apply: (next: DirectoryFilters) => void;
  update: (partial: Partial<DirectoryFilters>) => void;
  /** True while the server is fetching results for the latest filters. */
  isPending: boolean;
};

const FilterContext = createContext<FilterContextValue | null>(null);

/**
 * Holds filter state on the client so checkboxes and chips respond immediately,
 * then pushes the URL in a transition. Without this, every interaction waited on
 * an RSC round-trip (DB query included) before anything visibly changed.
 */
export function DirectoryFilterProvider({
  serverFilters,
  children,
}: {
  serverFilters: DirectoryFilters;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [filters, setFilters] = useState(serverFilters);

  // Track what we last pushed so we can tell our own navigations apart from
  // external ones (back/forward, a link elsewhere on the page).
  const pushedRef = useRef<string | null>(null);

  useEffect(() => {
    const incoming = filtersToQueryString(serverFilters);
    if (incoming === pushedRef.current) {
      // Server caught up with a change we made — local state already matches.
      pushedRef.current = null;
      return;
    }
    // URL changed from outside this component tree; adopt it.
    setFilters(serverFilters);
  }, [serverFilters]);

  function apply(next: DirectoryFilters) {
    setFilters(next); // Immediate, so controls repaint this frame.

    const qs = filtersToQueryString(next);
    pushedRef.current = qs;
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  function update(partial: Partial<DirectoryFilters>) {
    // Any filter change resets to page 1 unless a page is explicitly provided.
    apply({ ...filters, ...partial, page: partial.page ?? 1 });
  }

  return (
    <FilterContext value={{ filters, apply, update, isPending }}>
      {children}
    </FilterContext>
  );
}

export function useDirectoryFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) {
    throw new Error(
      "useDirectoryFilters must be used inside <DirectoryFilterProvider>",
    );
  }
  return ctx;
}
