import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

type RemotePatterns = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>;

/** Only image delivery URLs from this project's Cloudinary account. */
function cloudinaryPatterns(): RemotePatterns {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  if (!cloudName) return [];

  return [
    {
      protocol: "https",
      hostname: "res.cloudinary.com",
      port: "",
      pathname: `/${cloudName}/image/upload/**`,
      search: "",
    },
  ];
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: cloudinaryPatterns(),
  },
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withNextIntl(nextConfig);
