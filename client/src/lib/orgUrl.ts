/**
 * orgUrl.ts — Shared utilities for building org-specific URLs.
 *
 * All org content (forms, courses, school pages) must be served from the org's
 * subdomain (e.g. https://allaboutultrasound.teachific.app/) or custom domain,
 * NOT from the root domain with the org slug in the path.
 *
 * This ensures custom domain support works correctly: if an org uses their own
 * domain, all their content URLs automatically resolve to that domain.
 */

const MANUS_PREVIEW_PATTERN = /\.manus\.(space|computer)$/;
const RAILWAY_PREVIEW_PATTERN = /\.up\.railway\.app$/;

/**
 * Returns the base URL for an org's content.
 *
 * - On teachific.app (production): returns `https://{slug}.teachific.app`
 *   or `https://{customDomain}` if the org has a verified custom domain.
 * - On localhost / Manus preview / Railway preview: returns a path-based
 *   fallback `/school/{slug}` so development still works.
 *
 * @param slug                   The org's subdomain slug (e.g. "allaboutultrasound")
 * @param customDomain           Optional custom domain (e.g. "courses.example.com")
 * @param domainVerificationStatus  Optional verification status; only "verified" domains are used
 */
export function getOrgBaseUrl(
  slug: string,
  customDomain?: string | null,
  domainVerificationStatus?: string | null
): string {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;

  // On localhost or preview environments, use path-based fallback
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    MANUS_PREVIEW_PATTERN.test(hostname) ||
    RAILWAY_PREVIEW_PATTERN.test(hostname)
  ) {
    const portSuffix = port ? `:${port}` : "";
    return `${protocol}//${hostname}${portSuffix}/school/${slug}`;
  }

  // If the org has a verified custom domain, use it
  if (customDomain && domainVerificationStatus === "verified") {
    // Ensure the custom domain has a protocol
    if (customDomain.startsWith("http://") || customDomain.startsWith("https://")) {
      return customDomain.replace(/\/$/, "");
    }
    return `https://${customDomain}`;
  }

  // On production teachific.app, use subdomain format
  return `${protocol}//${slug}.teachific.app`;
}

/**
 * Returns the full URL for a form on an org's subdomain.
 * Forms are served at `{orgBaseUrl}/forms/{formSlug}`.
 *
 * @param slug        The org's subdomain slug
 * @param formSlug    The form's URL slug
 * @param customDomain  Optional verified custom domain
 * @param domainVerificationStatus  Optional verification status
 */
export function getOrgFormUrl(
  slug: string,
  formSlug: string,
  customDomain?: string | null,
  domainVerificationStatus?: string | null
): string {
  return `${getOrgBaseUrl(slug, customDomain, domainVerificationStatus)}/forms/${formSlug}`;
}

/**
 * Returns the full URL for a course sales page on an org's subdomain.
 * Courses are served at `{orgBaseUrl}/courses/{courseId}`.
 *
 * @param slug        The org's subdomain slug
 * @param courseId    The course ID
 * @param customDomain  Optional verified custom domain
 * @param domainVerificationStatus  Optional verification status
 */
export function getOrgCourseUrl(
  slug: string,
  courseId: number | string,
  customDomain?: string | null,
  domainVerificationStatus?: string | null
): string {
  return `${getOrgBaseUrl(slug, customDomain, domainVerificationStatus)}/courses/${courseId}`;
}

/**
 * Returns true if the current page is already on the given org's subdomain.
 * Used to decide whether to use relative paths or full subdomain URLs.
 */
export function isOnOrgSubdomain(slug: string): boolean {
  const hostname = window.location.hostname;
  return (
    hostname === `${slug}.teachific.app` ||
    // Also true if we're on the fallback /school/:slug path on localhost
    (
      (hostname === "localhost" || hostname === "127.0.0.1") &&
      window.location.pathname.startsWith(`/school/${slug}`)
    )
  );
}
