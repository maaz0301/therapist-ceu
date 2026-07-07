"use client";

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
  const { update, apply } = useFilterNav(filters);

  if (!hasActiveFilters(filters)) return null;

  const tagName = (id: string) => {
    for (const g of groups) {
      const found = g.options.find((o) => o.id === id);
      if (found) return found.name;
    }
    return "Topic";
  };

  const chips: Chip[] = [];

  if (filters.q) {
    chips.push({
      key: "q",
      label: `“${filters.q}”`,
      onRemove: () => update({ q: "" }),
    });
  }
  for (const f of filters.formats) {
    chips.push({
      key: `format-${f}`,
      label: f,
      onRemove: () => update({ formats: filters.formats.filter((x) => x !== f) }),
    });
  }
  if (filters.priceId) {
    const range = PRICE_RANGES.find((r) => r.id === filters.priceId);
    chips.push({
      key: "price",
      label: range?.label ?? "Price",
      onRemove: () => update({ priceId: null }),
    });
  }
  for (const p of filters.providers) {
    chips.push({
      key: `provider-${p}`,
      label: p,
      onRemove: () => update({ providers: filters.providers.filter((x) => x !== p) }),
    });
  }
  for (const code of filters.states) {
    chips.push({
      key: `state-${code}`,
      label: STATE_NAMES.get(code) ?? code,
      onRemove: () =>
        update({ states: filters.states.filter((x) => x !== code) }),
    });
  }
  for (const id of filters.tagIds) {
    chips.push({
      key: `tag-${id}`,
      label: tagName(id),
      onRemove: () => update({ tagIds: filters.tagIds.filter((x) => x !== id) }),
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className="inline-flex items-center gap-1 rounded-full border border-coral/20 bg-coral/10 px-3 py-1 text-sm font-medium text-coral transition-colors hover:bg-coral/20 hover:border-coral/30"
        >
          {chip.label}
          <X className="size-3.5 opacity-70" />
        </button>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={() => apply(EMPTY_FILTERS)}
      >
        Clear all
      </Button>
    </div>
  );
}
