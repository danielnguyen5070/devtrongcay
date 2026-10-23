import { renderSiteImage, siteImageMetadata } from "@/lib/og-image";

export function generateImageMetadata({ params }: { params: { locale: string } }) {
  return siteImageMetadata(params.locale);
}

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return renderSiteImage(locale);
}
