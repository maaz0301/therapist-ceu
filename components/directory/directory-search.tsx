"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import { useDirectoryFilters } from "@/components/directory/filter-provider";

export function DirectorySearch() {
  const { filters, update } = useDirectoryFilters();
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = value.trim();
    if (!term) return;

    if (!filters.q.includes(term)) {
      update({ q: [...filters.q, term] });
    }
    setValue(""); // Clear input to allow adding another tag
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-sm"
    >
      <Search className="size-4 shrink-0 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type a keyword and press Enter…"
        className="h-11 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        aria-label="Search trainings"
      />
    </form>
  );
}
