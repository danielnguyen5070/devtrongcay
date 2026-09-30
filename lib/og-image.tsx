import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { PRODUCTION_SITE_URL, SITE_LOGO_PATH, siteNameFor } from "@/lib/site";

export const OG_IMAGE_SIZE = { width: 1200, height: 630 };

const assets = Promise.all([
  readFile(join(process.cwd(), "assets/fonts/BeVietnamPro-SemiBold.ttf")),
  readFile(join(process.cwd(), "assets/fonts/BeVietnamPro-Regular.ttf")),
  readFile(join(process.cwd(), "public", SITE_LOGO_PATH), "base64"),
]);

function resolveLocale(locale: string) {
  return (routing.locales as readonly string[]).includes(locale)
    ? locale
    : routing.defaultLocale;
}

export async function siteImageMetadata(locale: string) {
  const t = await getTranslations({ locale: resolveLocale(locale), namespace: "home.metadata" });

  return [
    {
      id: "default",
      alt: t("ogImageAlt"),
      size: OG_IMAGE_SIZE,
      contentType: "image/png",
    },
  ];
}

export async function renderSiteImage(locale: string) {
  const resolved = resolveLocale(locale);
  const t = await getTranslations({ locale: resolved, namespace: "home.metadata" });
  const [semiBold, regular, logo] = await assets;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#080908",
          padding: 40,
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 72px",
            border: "1px solid rgba(255,255,255,0.14)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse only renders plain <img> */}
          <img
            src={`data:image/png;base64,${logo}`}
            width={96}
            height={96}
            alt=""
            style={{ borderRadius: 20 }}
          />
          <div
            style={{
              marginTop: 48,
              fontFamily: "Be Vietnam Pro",
              fontWeight: 600,
              fontSize: 88,
              letterSpacing: -2,
              color: "#e7e9e3",
            }}
          >
            {siteNameFor(resolved)}
          </div>
          <div
            style={{
              marginTop: 20,
              fontFamily: "Be Vietnam Pro",
              fontWeight: 400,
              fontSize: 36,
              color: "#9da39a",
            }}
          >
            {t("ogTagline")}
          </div>
          <div
            style={{
              marginTop: 56,
              fontFamily: "Be Vietnam Pro",
              fontWeight: 400,
              fontSize: 24,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#9da39a",
            }}
          >
            {new URL(PRODUCTION_SITE_URL).host}
          </div>
        </div>
      </div>
    ),
    {
      ...OG_IMAGE_SIZE,
      fonts: [
        { name: "Be Vietnam Pro", data: semiBold, weight: 600, style: "normal" },
        { name: "Be Vietnam Pro", data: regular, weight: 400, style: "normal" },
      ],
    },
  );
}
