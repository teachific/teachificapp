import { useEffect } from "react";

/**
 * Injects org-specific branding into the document <head>:
 * - Favicon (<link rel="icon">)
 * - Page title (document.title)
 *
 * Call this once per subdomain/custom-domain page tree.
 * Cleans up on unmount by restoring the default Teachific favicon.
 */
export function useOrgBranding(options: {
  faviconUrl?: string | null;
  schoolName?: string | null;
  logoUrl?: string | null;
}) {
  const { faviconUrl, schoolName } = options;

  useEffect(() => {
    // ── Favicon ──────────────────────────────────────────────────────────────
    let faviconEl = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    const originalHref = faviconEl?.href ?? "/favicon.ico";

    if (faviconUrl) {
      if (!faviconEl) {
        faviconEl = document.createElement("link");
        faviconEl.rel = "icon";
        document.head.appendChild(faviconEl);
      }
      faviconEl.href = faviconUrl;
    }

    // ── Page title ───────────────────────────────────────────────────────────
    const originalTitle = document.title;
    if (schoolName) {
      document.title = schoolName;
    }

    return () => {
      // Restore defaults on unmount
      if (faviconEl && faviconUrl) faviconEl.href = originalHref;
      if (schoolName) document.title = originalTitle;
    };
  }, [faviconUrl, schoolName]);
}
