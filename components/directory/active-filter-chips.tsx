"use client";

import { useOptimistic, startTransition } from "react";

import { X } from "lucide-react";

import { useFilterNav } from "@/components/directory/use-filter-nav";
import { Button } from "@/components/ui/button";
import { PRICE_RANGES, US_STATES } from "@/lib/constants";
import {
  EMPTY_FILTERS,
  hasActiveFilters,
  type DirectoryFilters,
} from "@/lib/directory-params";
import type { GroupedTags } from "@/lib/queries/tags";

const STATE_NAMES = new Map<string, string>(
  US_STATES.map((s) => [s.code, s.name]),
);

type Chip = { key: string; label: string; onRemove: () => void };

export function ActiveFilterChips({
  filters,
  groups,
}: {
  filters: DirectoryFilters;
  groups: GroupedTags;
}) {
  const { apply } = useFilterNav(filters);

  const [optimisticFilters, setOptimisticFilters] = useOptimistic<
    DirectoryFilters,
    DirectoryFilters
  >(filters, (state, newFilters) => newFilters);

  const handleApply = (next: DirectoryFilters) => {
    startTransition(() => {
      setOptimisticFilters(next);
    });
    apply(next);
  };

  if (!hasActiveFilters(optimisticFilters)) return null;

  const tagName = (id: string) => {
    for (const g of groups) {
      const found = g.options.find((o) => o.id === id);
      if (found) return found.name;
    }
    return "Topic";
  };

  const chips: Chip[] = [];

  for (const term of optimisticFilters.q) {
    chips.push({
      key: `q-${term}`,
      label: `“${term}”`,
      onRemove: () =>
        handleApply({
          ...optimisticFilters,
          q: optimisticFilters.q.filter((x) => x !== term),
          page: 1,
        }),
    });
  }
  for (const f of optimisticFilters.formats) {
    chips.push({
      key: `format-${f}`,
      label: f,
      onRemove: () =>
        handleApply({
          ...optimisticFilters,
          formats: optimisticFilters.formats.filter((x) => x !== f),
          page: 1,
        }),
    });
  }
  if (optimisticFilters.priceId) {
    const range = PRICE_RANGES.find((r) => r.id === optimisticFilters.priceId);
    chips.push({
      key: "price",
      label: range?.label ?? "Price",
      onRemove: () => handleApply({ ...optimisticFilters, priceId: null, page: 1 }),
    });
  }
  for (const p of optimisticFilters.providers) {
    chips.push({
      key: `provider-${p}`,
      label: p,
      onRemove: () =>
        handleApply({
          ...optimisticFilters,
          providers: optimisticFilters.providers.filter((x) => x !== p),
          page: 1,
        }),
    });
  }
  for (const code of optimisticFilters.states) {
    chips.push({
      key: `state-${code}`,
      label: STATE_NAMES.get(code) ?? code,
      onRemove: () =>
        handleApply({
          ...optimisticFilters,
          states: optimisticFilters.states.filter((x) => x !== code),
          page: 1,
        }),
    });
  }
  for (const id of optimisticFilters.tagIds) {
    chips.push({
      key: `tag-${id}`,
      label: tagName(id),
      onRemove: () =>
        handleApply({
          ...optimisticFilters,
          tagIds: optimisticFilters.tagIds.filter((x) => x !== id),
          page: 1,
        }),
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className="inline-flex items-center gap-1 rounded-full border border-coral/20 bg-coral/10 px-3 py-1 text-sm font-medium text-coral transition-colors hover:bg-coral/20 hover:border-coral/30 max-w-full"
        >
          <span className="truncate max-w-[12rem] sm:max-w-[20rem]">
            {chip.label}
          </span>
          <X className="size-3.5 shrink-0 opacity-70" />
        </button>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={() => handleApply(EMPTY_FILTERS)}
      >
        Clear all
      </Button>
    </div>
  );
}
