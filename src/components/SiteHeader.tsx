"use client";

import { useI18n } from "@/lib/i18n/client";
import { Mic } from "lucide-react";
import Link from "next/link";
import { LocaleSwitcher } from "./LocaleSwitcher";

export function SiteHeader() {
  const { t } = useI18n();
  return (
    <header className="border-b border-border bg-card/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-white">
            <Mic className="size-4" />
          </span>
          BetterMy Pitch
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted">
          <Link href="/#new" className="hidden hover:text-foreground sm:inline">
            {t.nav.newSession}
          </Link>
          <Link href="/#history" className="hidden hover:text-foreground sm:inline">
            {t.nav.history}
          </Link>
          <LocaleSwitcher />
        </nav>
      </div>
    </header>
  );
}
