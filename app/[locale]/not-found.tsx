import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <h1 className="text-[11px] tracking-[0.3em] text-[#d6dad2] uppercase">
        {t("title")}
      </h1>
      <p className="mt-4 text-sm text-[#9da39a]">{t("description")}</p>
      <Link
        href="/"
        className="mt-8 text-[11px] tracking-[0.3em] text-[#d6dad2] uppercase hover:text-[#e7e9e3]"
      >
        {t("home")}
      </Link>
    </main>
  );
}
