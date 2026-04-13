/**
 * Shared org-slug utilities (server-side only — uses DB).
 * Import from server code; do NOT import in client bundles.
 */

/**
 * Sanitise a raw string into a valid org slug:
 * lowercase, alphanumeric + hyphens, max 50 chars, no leading/trailing hyphens.
 */
export function sanitizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

/**
 * Generate a unique org slug from a name.
 * Tries `base`, then `base-2`, `base-3`, … until one is free.
 * `isSlugTaken` is an async predicate supplied by the caller (avoids circular imports).
 */
export async function generateUniqueOrgSlug(
  name: string,
  isSlugTaken: (slug: string) => Promise<boolean>
): Promise<string> {
  const base = sanitizeSlug(name) || "school";
  if (!(await isSlugTaken(base))) return base;
  for (let i = 2; i <= 999; i++) {
    const candidate = `${base}-${i}`;
    if (!(await isSlugTaken(candidate))) return candidate;
  }
  // Extremely unlikely fallback
  return `${base}-${Date.now()}`;
}
