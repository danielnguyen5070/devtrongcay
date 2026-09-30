import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CheckoutForm } from "@/components/cart/checkout-form";
import { Link } from "@/i18n/navigation";
import { localeToOg, siteNameFor } from "@/lib/site";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });
  const path = `/${locale}/checkout`;

  return {
    title: t("title"),
    robots: { index: false, follow: false },
    alternates: { canonical: path },
    openGraph: {
      title: t("title"),
      url: path,
      siteName: siteNameFor(locale),
      locale: localeToOg(locale),
      type: "website",
    },
  };
}

export default async function CheckoutPage() {
  const t = await getTranslations("checkout");

  return (
    <main className="article-shell">
      <div className="article-frame">
        <Link
          href="/"
          className="text-[11px] tracking-[0.3em] text-[#9da39a] uppercase transition-colors hover:text-[#e7e9e3]"
        >
          {t("back")}
        </Link>
        <h1 className="mt-10 font-heading text-3xl font-normal tracking-tight text-[#e7e9e3] md:text-4xl">
          {t("title")}
        </h1>
        <CheckoutForm />
      </div>
    </main>
  );
}
