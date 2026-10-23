export const SITE_NAME = "Cây Trong Nhà";
export const SITE_NAME_EN = "Cay Trong Nha";
export const SITE_AUTHOR = SITE_NAME;
export const SITE_LOGO_PATH = "/images/icon-512.png";
export const PRODUCTION_SITE_URL = "https://caytrongnha.com";

export function siteNameFor(locale: string) {
  return locale === "en" ? SITE_NAME_EN : SITE_NAME;
}

/**
 * Canonical site origin for metadata, sitemap, and absolute URLs:
 * 1. NEXT_PUBLIC_SITE_URL when set
 * 2. PRODUCTION_SITE_URL on Vercel production
 * 3. VERCEL_URL on Vercel previews
 * 4. http://localhost:3000 locally
 */
export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  if (process.env.VERCEL_ENV === "production") {
    return PRODUCTION_SITE_URL;
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return vercel.startsWith("http://") || vercel.startsWith("https://")
      ? vercel.replace(/\/$/, "")
      : `https://${vercel}`;
  }

  return "http://localhost:3000";
}

/** Block search engines on staging/preview. Set NEXT_PUBLIC_NO_INDEX=false in production. */
export function isNoIndexSite() {
  const flag = process.env.NEXT_PUBLIC_NO_INDEX?.trim().toLowerCase();
  if (flag === "true" || flag === "1") return true;
  if (flag === "false" || flag === "0") return false;

  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv) {
    return vercelEnv !== "production";
  }

  return process.env.NODE_ENV !== "production";
}

export function absoluteUrl(path: string) {
  const base = getSiteUrl().replace(/\/$/, "");
  if (!path || path === "/") {
    return base;
  }

  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function localeToOg(locale: string) {
  return locale === "vi" ? "vi_VN" : "en_US";
}

export function alternateOgLocale(locale: string) {
  return locale === "vi" ? "en_US" : "vi_VN";
}
