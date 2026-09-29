import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { quoteCart } from "@/lib/cart/quote";
import { parseCartItems } from "@/lib/cart/types";

const NO_STORE = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400, headers: NO_STORE });
  }

  const { items: rawItems, locale: rawLocale } = (body ?? {}) as Record<string, unknown>;
  const items = parseCartItems(rawItems);
  if (!items) {
    return Response.json({ error: "invalid_items" }, { status: 400, headers: NO_STORE });
  }

  const locale =
    typeof rawLocale === "string" && hasLocale(routing.locales, rawLocale)
      ? rawLocale
      : routing.defaultLocale;

  try {
    const quote = await quoteCart(items, locale);
    return Response.json(quote, { headers: NO_STORE });
  } catch {
    return Response.json({ error: "quote_failed" }, { status: 500, headers: NO_STORE });
  }
}
