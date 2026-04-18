import { useEffect } from "react";

/**
 * Injects org-specific branding into the document <head>:
 * - Favicon (<link rel="icon">)
 * - Page title (document.title)
 * - Meta description, keywords, robots
 * - Open Graph tags (og:title, og:description, og:image)
 * - Custom CSS (<style id="org-custom-css">)
 *
 * Call this once per subdomain/custom-domain page tree.
 * Cleans up on unmount by restoring defaults.
 */
export function useOrgBranding(options: {
  faviconUrl?: string | null;
  schoolName?: string | null;
  logoUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  seoOgImageUrl?: string | null;
  seoRobotsIndex?: boolean | null;
  customCss?: string | null;
}) {
  const {
    faviconUrl,
    schoolName,
    seoTitle,
    seoDescription,
    seoKeywords,
    seoOgImageUrl,
    seoRobotsIndex,
    customCss,
  } = options;

  useEffect(() => {
    const injected: (() => void)[] = []; // cleanup callbacks

    // ── Helper: set/create a <meta> tag ──────────────────────────────────────
    function setMeta(selector: string, attr: string, value: string) {
      let el = document.querySelector<HTMLMetaElement>(selector);
      const created = !el;
      if (!el) {
        el = document.createElement("meta");
        document.head.appendChild(el);
      }
      const prev = el.getAttribute("content") ?? null;
      el.setAttribute(attr.includes("=") ? attr.split("=")[0] : attr, attr.includes("=") ? attr.split("=")[1] : value);
      if (attr.includes("=")) el.setAttribute("content", value);
      injected.push(() => {
        if (created) el!.remove();
        else if (prev !== null) el!.setAttribute("content", prev);
        else el!.removeAttribute("content");
      });
    }

    function setMetaByName(name: string, content: string) {
      let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
      const created = !el;
      const prev = el?.getAttribute("content") ?? null;
      if (!el) { el = document.createElement("meta"); el.name = name; document.head.appendChild(el); }
      el.content = content;
      injected.push(() => {
        if (created) el!.remove();
        else if (prev !== null) el!.content = prev;
        else el!.removeAttribute("content");
      });
    }

    function setMetaByProperty(property: string, content: string) {
      let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
      const created = !el;
      const prev = el?.getAttribute("content") ?? null;
      if (!el) { el = document.createElement("meta"); el.setAttribute("property", property); document.head.appendChild(el); }
      el.setAttribute("content", content);
      injected.push(() => {
        if (created) el!.remove();
        else if (prev !== null) el!.setAttribute("content", prev);
        else el!.removeAttribute("content");
      });
    }

    // ── Favicon ──────────────────────────────────────────────────────────────
    let faviconEl = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    const originalHref = faviconEl?.href ?? "/favicon.ico";
    if (faviconUrl) {
      if (!faviconEl) { faviconEl = document.createElement("link"); faviconEl.rel = "icon"; document.head.appendChild(faviconEl); }
      faviconEl.href = faviconUrl;
      injected.push(() => { if (faviconEl) faviconEl.href = originalHref; });
    }

    // ── Page title ───────────────────────────────────────────────────────────
    const originalTitle = document.title;
    const resolvedTitle = seoTitle || schoolName || null;
    if (resolvedTitle) {
      document.title = resolvedTitle;
      injected.push(() => { document.title = originalTitle; });
    }

    // ── Meta description ─────────────────────────────────────────────────────
    if (seoDescription) setMetaByName("description", seoDescription);

    // ── Meta keywords ────────────────────────────────────────────────────────
    if (seoKeywords) setMetaByName("keywords", seoKeywords);

    // ── Robots ───────────────────────────────────────────────────────────────
    if (seoRobotsIndex === false) {
      setMetaByName("robots", "noindex, nofollow");
    } else if (seoRobotsIndex === true) {
      setMetaByName("robots", "index, follow");
    }

    // ── Open Graph ───────────────────────────────────────────────────────────
    if (resolvedTitle) setMetaByProperty("og:title", resolvedTitle);
    if (seoDescription) setMetaByProperty("og:description", seoDescription);
    if (seoOgImageUrl) setMetaByProperty("og:image", seoOgImageUrl);

    // ── Custom CSS ───────────────────────────────────────────────────────────
    if (customCss) {
      let styleEl = document.getElementById("org-custom-css") as HTMLStyleElement | null;
      const created = !styleEl;
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = "org-custom-css";
        document.head.appendChild(styleEl);
      }
      const prev = styleEl.textContent;
      styleEl.textContent = customCss;
      injected.push(() => {
        if (created) styleEl!.remove();
        else styleEl!.textContent = prev;
      });
    }

    return () => {
      injected.forEach((fn) => fn());
    };
  }, [faviconUrl, schoolName, seoTitle, seoDescription, seoKeywords, seoOgImageUrl, seoRobotsIndex, customCss]);
}
