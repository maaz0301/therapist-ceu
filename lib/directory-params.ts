import {
  LISTING_FORMATS,
  CEU_PROVIDERS,
  PRICE_RANGES,
  type ListingFormat,
  type PriceRangeId,
} from "@/lib/constants";

export const DIRECTORY_PAGE_SIZE = 12;

export type DirectoryFilters = {
  q: string;
  states: string[];
  formats: ListingFormat[];
  priceId: PriceRangeId | null;
  providers: string[];
  tagIds: string[];
  page: number;
};

const VALID_FORMATS = new Set<string>(LISTING_FORMATS);
const VALID_PRICE_IDS = new Set<string>(PRICE_RANGES.map((p) => p.id));
const VALID_PROVIDERS = new Set<string>(CEU_PROVIDERS);

function readParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function readList(value: string | string[] | undefined): string[] {
  const raw = readParam(value);
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseDirectoryFilters(
  sp: Record<string, string | string[] | undefined>,
): DirectoryFilters {
  const formats = readList(sp.formats).filter((f): f is ListingFormat =>
    VALID_FORMATS.has(f),
  );
  const priceRaw = readParam(sp.price);
  const priceId =
    priceRaw && VALID_PRICE_IDS.has(priceRaw)
      ? (priceRaw as PriceRangeId)
      : null;
  const providers = readList(sp.providers).filter((p) =>
    VALID_PROVIDERS.has(p),
  );
  const pageRaw = Number(readParam(sp.page));
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

  return {
    q: (readParam(sp.q) ?? "").trim(),
    states: readList(sp.states),
    formats,
    priceId,
    providers,
    tagIds: readList(sp.tags),
    page,
  };
}

/** Serializes filters into a query string (omits defaults/empties). */
export function filtersToQueryString(filters: DirectoryFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.states.length) params.set("states", filters.states.join(","));
  if (filters.formats.length) params.set("formats", filters.formats.join(","));
  if (filters.priceId) params.set("price", filters.priceId);
  if (filters.providers.length) params.set("providers", filters.providers.join(","));
  if (filters.tagIds.length) params.set("tags", filters.tagIds.join(","));
  if (filters.page > 1) params.set("page", String(filters.page));
  return params.toString();
}

export function hasActiveFilters(filters: DirectoryFilters): boolean {
  return Boolean(
    filters.q ||
      filters.states.length ||
      filters.formats.length ||
      filters.priceId ||
      filters.providers.length ||
      filters.tagIds.length,
  );
}

export const EMPTY_FILTERS: DirectoryFilters = {
  q: "",
  states: [],
  formats: [],
  priceId: null,
  providers: [],
  tagIds: [],
  page: 1,
};
