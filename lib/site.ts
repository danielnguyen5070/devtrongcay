export const SITE_NAME = "Dev Trồng Cây";
export const SITE_NAME_EN = "Dev Trong Cay";

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://devtrongcay.com";
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
