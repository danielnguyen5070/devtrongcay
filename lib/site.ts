export const SITE_NAME = "Dev Trồng Cây";
export const SITE_NAME_EN = "Dev Trong Cay";

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://devtrongcay.com";
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
