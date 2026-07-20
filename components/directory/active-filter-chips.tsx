"use client";

import { X } from "lucide-react";

import { useDirectoryFilters } from "@/components/directory/filter-provider";
import { Button } from "@/components/ui/button";
import { PRICE_RANGES, US_STATES } from "@/lib/constants";
import { EMPTY_FILTERS, hasActiveFilters } from "@/lib/directory-params";
import type { GroupedTags } from "@/lib/queries/tags";

const STATE_NAMES = new Map<string, string>(
  US_STATES.map((s) => [s.code, s.name]),
);

type Chip = { key: string; label: string; onRemove: () => void };

export function ActiveFilterChips({ groups }: { groups: GroupedTags }) {
  const { filters, apply } = useDirectoryFilters();

  if (!hasActiveFilters(filters)) return null;

  const tagName = (id: string) => {
    for (const g of groups) {
      const found = g.options.find((o) => o.id === id);
      if (found) return found.name;
    }
    return "Topic";
  };

  const chips: Chip[] = [];

  for (const term of filters.q) {
    chips.push({
      key: `q-${term}`,
      label: `“${term}”`,
      onRemove: () =>
        apply({
          ...filters,
          q: filters.q.filter((x) => x !== term),
          page: 1,
        }),
    });
  }
  for (const f of filters.formats) {
    chips.push({
      key: `format-${f}`,
      label: f,
      onRemove: () =>
        apply({
          ...filters,
          formats: filters.formats.filter((x) => x !== f),
          page: 1,
        }),
    });
  }
  if (filters.priceId) {
    const range = PRICE_RANGES.find((r) => r.id === filters.priceId);
    chips.push({
      key: "price",
      label: range?.label ?? "Price",
      onRemove: () => apply({ ...filters, priceId: null, page: 1 }),
    });
  }
  for (const p of filters.providers) {
    chips.push({
      key: `provider-${p}`,
      label: p,
      onRemove: () =>
        apply({
          ...filters,
          providers: filters.providers.filter((x) => x !== p),
          page: 1,
        }),
    });
  }
  for (const code of filters.states) {
    chips.push({
      key: `state-${code}`,
      label: STATE_NAMES.get(code) ?? code,
      onRemove: () =>
        apply({
          ...filters,
          states: filters.states.filter((x) => x !== code),
          page: 1,
        }),
    });
  }
  for (const id of filters.tagIds) {
    chips.push({
      key: `tag-${id}`,
      label: tagName(id),
      onRemove: () =>
        apply({
          ...filters,
          tagIds: filters.tagIds.filter((x) => x !== id),
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
          className="inline-flex items-center gap-1 rounded-full border border-clay/20 bg-clay/10 px-3 py-1 text-sm font-medium text-clay transition-colors hover:bg-clay/20 hover:border-clay/30 max-w-full"
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
        onClick={() => apply(EMPTY_FILTERS)}
      >
        Clear all
      </Button>
    </div>
  );
}
