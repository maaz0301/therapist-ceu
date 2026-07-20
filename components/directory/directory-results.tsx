"use client";

import { useDirectoryFilters } from "@/components/directory/filter-provider";

/** Dims the result grid while the server fetches results for the new filters. */
export function DirectoryResults({ children }: { children: React.ReactNode }) {
  const { isPending } = useDirectoryFilters();

  return (
    <div
      aria-busy={isPending}
      className={
        isPending
          ? "opacity-60 transition-opacity duration-200"
          : "transition-opacity duration-200"
      }
    >
      {children}
    </div>
  );
}
