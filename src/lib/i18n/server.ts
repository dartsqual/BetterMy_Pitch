import { cookies, headers } from "next/headers";
import { dictionaries, isLocale, LOCALE_COOKIE, type Locale } from "./dictionaries";

/** Interface locale: cookie first, then the browser's Accept-Language. */
export async function getLocale(): Promise<Locale> {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;
  const accept = (await headers()).get("accept-language") ?? "";
  return /^\s*pt\b/i.test(accept) ? "pt" : "en";
}

export async function getDictionary() {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
}
