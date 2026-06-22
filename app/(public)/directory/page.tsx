import { SearchX } from "lucide-react";

import { ActiveFilterChips } from "@/components/directory/active-filter-chips";
import { DirectoryFilters } from "@/components/directory/directory-filters";
import { DirectorySearch } from "@/components/directory/directory-search";
import { EmptyState } from "@/components/empty-state";
import { ListingCard } from "@/components/listing-card";
import { ButtonLink } from "@/components/ui/button-link";
import {
  filtersToQueryString,
  parseDirectoryFilters,
} from "@/lib/directory-params";
import { searchListings } from "@/lib/queries/directory";
import { getGroupedTags } from "@/lib/queries/tags";

export const metadata = {
  title: "Browse trainings",
  description:
    "Search and filter CEU and professional trainings for therapists by topic, format, price, location, and accreditation.",
};

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = parseDirectoryFilters(sp);

  const [result, groups] = await Promise.all([
    searchListings(filters),
    getGroupedTags(),
  ]);

  const pageHref = (page: number) => {
    const qs = filtersToQueryString({ ...filters, page });
    return qs ? `/directory?${qs}` : "/directory";
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Browse trainings
        </h1>
        <p className="text-muted-foreground">
          Find CEU and professional trainings — filter by topic, format, price,
          location, and accreditation. No account needed.
        </p>
      </div>

      <div className="mt-6">
        <DirectorySearch filters={filters} />
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[14rem_1fr]">
        <DirectoryFilters filters={filters} groups={groups} />

        <div className="min-w-0 space-y-4">
          <ActiveFilterChips filters={filters} groups={groups} />

          <p className="text-sm text-muted-foreground">
            {result.total} training{result.total === 1 ? "" : "s"} found
          </p>

          {result.items.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No trainings match your filters"
              description="Try removing a filter or broadening your search to see more results."
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {result.items.map((item) => (
                <ListingCard key={item.id} listing={item} />
              ))}
            </div>
          )}

          {result.totalPages > 1 ? (
            <nav className="flex items-center justify-between border-t border-border pt-4">
              <ButtonLink
                variant="outline"
                size="sm"
                href={pageHref(Math.max(1, result.page - 1))}
                aria-disabled={result.page <= 1}
                className={
                  result.page <= 1 ? "pointer-events-none opacity-50" : ""
                }
              >
                Previous
              </ButtonLink>
              <span className="text-sm text-muted-foreground">
                Page {result.page} of {result.totalPages}
              </span>
              <ButtonLink
                variant="outline"
                size="sm"
                href={pageHref(Math.min(result.totalPages, result.page + 1))}
                aria-disabled={result.page >= result.totalPages}
                className={
                  result.page >= result.totalPages
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              >
                Next
              </ButtonLink>
            </nav>
          ) : null}
        </div>
      </div>
    </div>
  );
}
