"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

import { useFilterNav } from "@/components/directory/use-filter-nav";
import type { DirectoryFilters } from "@/lib/directory-params";

export function DirectorySearch({ filters }: { filters: DirectoryFilters }) {
  const { update } = useFilterNav(filters);
  const [value, setValue] = useState(filters.q);
  const [prevQ, setPrevQ] = useState(filters.q);
  const initial = useRef(true);

  // Sync the input when the URL's query changes externally (e.g. "Clear all").
  // Adjusting state during render avoids a cascading effect render.
  if (filters.q !== prevQ) {
    setPrevQ(filters.q);
    setValue(filters.q);
  }

  // Debounced live search.
  useEffect(() => {
    if (initial.current) {
      initial.current = false;
      return;
    }
    const t = setTimeout(() => {
      if (value.trim() !== filters.q) update({ q: value.trim() });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim() !== filters.q) update({ q: value.trim() });
      }}
      className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3"
    >
      <Search className="size-4 shrink-0 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search by keyword, topic, or presenter…"
        className="h-11 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        aria-label="Search trainings"
      />
    </form>
  );
}
