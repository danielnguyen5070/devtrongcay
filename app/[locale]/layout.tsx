import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { FloatingSocialBar } from "@/components/floating-social-bar";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { routing } from "@/i18n/routing";
import { fontVariables } from "@/lib/fonts";
import {
  SITE_NAME,
  SITE_NAME_EN,
  absoluteUrl,
  getSiteUrl,
  isNoIndexSite,
} from "@/lib/site";
import "../globals.css";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home.metadata" });
  const siteName = locale === "en" ? SITE_NAME_EN : SITE_NAME;
  const noIndex = isNoIndexSite();

  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: t("title"),
      template: `%s | ${siteName}`,
    },
    description: t("description"),
    keywords: t("keywords"),
    applicationName: siteName,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        vi: "/vi",
        en: "/en",
        "x-default": `/${routing.defaultLocale}`,
      },
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
    openGraph: {
      type: "website",
      siteName,
      title: t("title"),
      description: t("description"),
      url: absoluteUrl(`/${locale}`),
      locale: locale === "vi" ? "vi_VN" : "en_US",
      alternateLocale: locale === "vi" ? ["en_US"] : ["vi_VN"],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className={`${fontVariables} h-full dark antialiased`}>
      <body className="min-h-full bg-background font-sans text-foreground">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <FloatingSocialBar />
          <LocaleSwitcher />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
