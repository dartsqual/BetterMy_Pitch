"use client";

import { useI18n } from "@/lib/i18n/client";
import { LOCALES, type Locale } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

const LABELS: Record<Locale, string> = { en: "EN", pt: "PT-BR" };

export function LocaleSwitcher() {
  const { locale, t, setLocale } = useI18n();
  return (
    <div role="group" aria-label={t.nav.language} className="flex rounded-lg border border-border p-0.5 text-xs">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => l !== locale && setLocale(l)}
          aria-pressed={l === locale}
          className={cn(
            "rounded-md px-2 py-1 font-medium transition-colors",
            l === locale ? "bg-accent text-white" : "text-muted hover:text-foreground",
          )}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
