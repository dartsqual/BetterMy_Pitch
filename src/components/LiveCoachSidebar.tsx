"use client";

import { useI18n } from "@/lib/i18n/client";
import type { CoachHint } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { Loader2, Sparkles } from "lucide-react";

export type HintEntry = { messageId: string; hint: CoachHint };

export function LiveCoachSidebar({
  hints,
  thinking,
  enabled,
  onToggle,
  framework,
}: {
  hints: HintEntry[];
  thinking: boolean;
  enabled: boolean;
  onToggle: (on: boolean) => void;
  framework: string;
}) {
  const { t } = useI18n();
  const latest = hints[hints.length - 1];
  const earlier = hints.slice(0, -1).reverse();

  return (
    <aside className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card lg:min-h-0">
      <header className="flex items-center justify-between gap-3 border-b border-border p-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted">{t.coach.title}</div>
          <div className="font-semibold">{t.coach.onlyYou} · {t.frameworks[framework as keyof typeof t.frameworks]?.label ?? framework}</div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={enabled} onChange={(e) => onToggle(e.target.checked)} />
          {t.coach.toggle}
        </label>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {!enabled && <p className="text-sm text-muted">{t.coach.paused}</p>}

        {enabled && thinking && (
          <div className="flex items-center gap-2 text-sm text-coach">
            <Loader2 className="size-4 animate-spin" /> {t.coach.reading}
          </div>
        )}

        {latest ? (
          <div className="space-y-3 rounded-xl border border-coach/40 bg-coach-soft p-4">
            <div className="flex items-start gap-2 text-sm font-medium text-coach">
              <Sparkles className="mt-0.5 size-4 shrink-0" />
              {latest.hint.signal}
            </div>
            <ul className="space-y-2">
              {latest.hint.tips.map((tip, i) => (
                <li key={i} className="text-sm leading-relaxed">
                  → {tip}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          enabled &&
          !thinking && (
            <p className="text-sm text-muted">{t.coach.empty}</p>
          )
        )}

        {earlier.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-wide text-muted">{t.coach.earlier}</div>
            {earlier.map(({ messageId, hint }) => (
              <div key={messageId} className={cn("rounded-lg border border-border p-3 text-sm opacity-80")}>
                <div className="font-medium">{hint.signal}</div>
                <ul className="mt-1 space-y-1 text-muted">
                  {hint.tips.map((t, i) => (
                    <li key={i}>→ {t}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
