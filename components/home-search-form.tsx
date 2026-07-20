"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HomeSearchForm() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setError("Please enter a keyword to search.");
      return;
    }
    setError(null);
    router.push(`/directory?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="mx-auto mt-8 w-full max-w-xl text-left">
      <form
        onSubmit={handleSubmit}
        className="flex w-full items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-lg shadow-clay/10 transition-all focus-within:ring-2 focus-within:ring-primary/20"
      >
        <div className="flex flex-1 items-center gap-2 pl-3">
          <Search className="size-5 shrink-0 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.trim()) {
                setError(null);
              }
            }}
            placeholder="Try “EMDR”, “eating disorders”, “ethics”…"
            className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label="Search trainings"
          />
        </div>
        <Button type="submit" variant="clay" size="lg">
          Search
        </Button>
      </form>
      {error && (
        <p className="mt-2 text-sm text-clay font-medium animate-in fade-in slide-in-from-top-1 duration-200 pl-4">
          {error}
        </p>
      )}
    </div>
  );
}
