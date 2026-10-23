import type { MetadataRoute } from "next";
import { getSiteUrl, isNoIndexSite } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (isNoIndexSite()) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${getSiteUrl().replace(/\/$/, "")}/sitemap.xml`,
    host: getSiteUrl(),
  };
}
