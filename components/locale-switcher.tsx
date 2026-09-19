"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("locale");

  return (
    <nav className="locale-switcher" aria-label={t("label")}>
      {routing.locales.map((code) => (
        <Link
          key={code}
          href={pathname}
          locale={code}
          aria-current={code === locale ? "true" : undefined}
          aria-label={t(code)}
        >
          {code}
        </Link>
      ))}
    </nav>
  );
}

export { LocaleSwitcher };
