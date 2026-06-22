/** Converts text into a URL-safe slug. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[()/+]/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Short random suffix used to de-duplicate slugs. */
export function shortId(): string {
  return Math.random().toString(36).slice(2, 8);
}
