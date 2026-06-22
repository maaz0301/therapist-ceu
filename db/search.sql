-- Keyword search support: trigram fuzzy matching for ILIKE queries.
-- Full-text search uses the generated listings.search_vector (+ GIN index)
-- already created by the schema migration. Idempotent.

create extension if not exists pg_trgm;

create index if not exists listings_title_trgm
  on public.listings using gin (title gin_trgm_ops);

create index if not exists listings_presenter_trgm
  on public.listings using gin (presenter_names gin_trgm_ops);
