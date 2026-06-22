"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";

import { useFilterNav } from "@/components/directory/use-filter-nav";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  CEU_FILTER_OPTIONS,
  LISTING_FORMATS,
  PRICE_RANGES,
  US_STATES,
} from "@/lib/constants";
import {
  hasActiveFilters,
  type CeuFilter,
  type DirectoryFilters,
} from "@/lib/directory-params";
import type { GroupedTags } from "@/lib/queries/tags";
import { cn } from "@/lib/utils";

function toggle<T>(arr: T[], value: T): T[] {
  return arr.includes(value)
    ? arr.filter((x) => x !== value)
    : [...arr, value];
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      {children}
    </h3>
  );
}

function CheckRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      <span>{label}</span>
    </label>
  );
}

function FilterPanel({
  filters,
  groups,
}: {
  filters: DirectoryFilters;
  groups: GroupedTags;
}) {
  const { update } = useFilterNav(filters);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SectionTitle>Format</SectionTitle>
        <div className="space-y-1.5">
          {LISTING_FORMATS.map((f) => (
            <CheckRow
              key={f}
              label={f}
              checked={filters.formats.includes(f)}
              onChange={() => update({ formats: toggle(filters.formats, f) })}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <SectionTitle>CE credits</SectionTitle>
        <div className="inline-flex rounded-lg border border-border p-0.5">
          {CEU_FILTER_OPTIONS.map((opt) => {
            const value = opt.toLowerCase() as CeuFilter;
            const active = filters.ceu === value;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => update({ ceu: value })}
                className={cn(
                  "rounded-md px-3 py-1 text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <SectionTitle>Price</SectionTitle>
        <div className="space-y-1.5">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="price"
              checked={filters.priceId === null}
              onChange={() => update({ priceId: null })}
              className="accent-primary"
            />
            Any price
          </label>
          {PRICE_RANGES.map((range) => (
            <label
              key={range.id}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <input
                type="radio"
                name="price"
                checked={filters.priceId === range.id}
                onChange={() => update({ priceId: range.id })}
                className="accent-primary"
              />
              {range.label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <SectionTitle>Location</SectionTitle>
        <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-lg border border-border p-3">
          {US_STATES.map((state) => (
            <CheckRow
              key={state.code}
              label={state.name}
              checked={filters.states.includes(state.code)}
              onChange={() =>
                update({ states: toggle(filters.states, state.code) })
              }
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <SectionTitle>Topics</SectionTitle>
        {groups.map((group) =>
          group.options.length === 0 ? null : (
            <div key={group.category} className="space-y-1.5">
              <p className="text-xs font-medium text-foreground">
                {group.label}
              </p>
              <div className="space-y-1.5">
                {group.options.map((opt) => (
                  <CheckRow
                    key={opt.id}
                    label={opt.name}
                    checked={filters.tagIds.includes(opt.id)}
                    onChange={() =>
                      update({ tagIds: toggle(filters.tagIds, opt.id) })
                    }
                  />
                ))}
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

export function DirectoryFilters({
  filters,
  groups,
}: {
  filters: DirectoryFilters;
  groups: GroupedTags;
}) {
  const [open, setOpen] = useState(false);
  const active = hasActiveFilters(filters);

  return (
    <>
      {/* Mobile trigger */}
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button variant="outline" className="w-full justify-center">
                <SlidersHorizontal data-icon="inline-start" />
                Filters
                {active ? (
                  <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                    on
                  </span>
                ) : null}
              </Button>
            }
          />
          <SheetContent side="left" className="w-[88%] max-w-sm overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-8">
              <FilterPanel filters={filters} groups={groups} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2">
          <FilterPanel filters={filters} groups={groups} />
        </div>
      </aside>
    </>
  );
}
