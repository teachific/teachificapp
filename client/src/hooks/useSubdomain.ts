/**
 * useSubdomain
 *
 * Detects whether the app is running on an org-specific subdomain
 * (e.g. allaboutultrasound.teachific.app) and returns the subdomain slug.
 *
 * Returns null when running on the root domain (teachific.app, www.teachific.app,
 * localhost, or any Manus preview URL).
 */

const ROOT_DOMAINS = new Set([
  "teachific.app",
  "www.teachific.app",
  "localhost",
  "127.0.0.1",
]);

// Manus preview domains follow the pattern: *.manus.space or *.manus.computer
const MANUS_PREVIEW_PATTERN = /\.manus\.(space|computer)$/;

export function getSubdomain(): string | null {
  const hostname = window.location.hostname;

  // Never treat root domains or Manus preview URLs as subdomains
  if (ROOT_DOMAINS.has(hostname)) return null;
  if (MANUS_PREVIEW_PATTERN.test(hostname)) return null;

  // Split hostname into parts: ["allaboutultrasound", "teachific", "app"]
  const parts = hostname.split(".");

  // We need at least 3 parts for a subdomain (sub.domain.tld)
  if (parts.length < 3) return null;

  const sub = parts[0];

  // Exclude "www" as a valid org subdomain
  if (sub === "www") return null;

  return sub;
}

export function useSubdomain(): string | null {
  // This is a pure synchronous read — no need for useState/useEffect
  return getSubdomain();
}

/**
 * Returns true if the current environment supports real subdomains
 * (i.e. we're on teachific.app, not localhost or a Manus preview URL).
 */
export function supportsSubdomains(): boolean {
  const hostname = window.location.hostname;
  return !ROOT_DOMAINS.has(hostname) && !MANUS_PREVIEW_PATTERN.test(hostname) && hostname !== "localhost" && hostname !== "127.0.0.1";
}

/**
 * Builds the full URL for an org's subdomain.
 * On teachific.app: returns https://slug.teachific.app/path
 * On localhost/preview: returns /school/slug/path (fallback, no real subdomain)
 */
export function getOrgSubdomainUrl(slug: string, path = ""): string {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;

  // On localhost or Manus preview, can't use real subdomains — use /school/:slug fallback
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    MANUS_PREVIEW_PATTERN.test(hostname)
  ) {
    const portSuffix = port ? `:${port}` : "";
    return `${protocol}//${hostname}${portSuffix}/school/${slug}${path}`;
  }

  // On root domain (teachific.app or www.teachific.app), build the subdomain URL
  const rootDomain = hostname.replace(/^www\./, "");
  return `${protocol}//${slug}.${rootDomain}${path}`;
}
