"use client";

import { PERSONAS } from "@/lib/catalog";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { UserPlus } from "lucide-react";

export type PersonaDraft = { id: string; name: string; title: string; brief: string };
export type PersonaTemplateDto = { id: string; name: string; title: string; brief: string };

const CUSTOM_ID = "custom";

export function PersonaSelector({
  value,
  onChange,
  templates,
}: {
  value: PersonaDraft;
  onChange: (p: PersonaDraft) => void;
  templates: PersonaTemplateDto[];
}) {
  const { t } = useI18n();
  const pick = (p: PersonaTemplateDto, id = p.id) =>
    onChange({ id, name: p.name, title: p.title, brief: p.brief });

  const options = [
    ...PERSONAS.map((p) => ({
      key: p.id,
      emoji: p.emoji,
      persona: { ...p, title: t.personas[p.id]?.title ?? p.title, brief: t.personas[p.id]?.brief ?? p.brief },
      id: p.id,
    })),
    ...templates.map((t) => ({ key: `tpl-${t.id}`, emoji: "⭐", persona: t, id: `tpl-${t.id}` })),
  ];

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map(({ key, emoji, persona, id }) => (
          <button
            key={key}
            type="button"
            onClick={() => pick(persona, id)}
            className={cn(
              "rounded-xl border p-3 text-left transition-colors",
              value.id === id ? "border-accent bg-accent-soft" : "border-border hover:border-accent/50",
            )}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <span aria-hidden>{emoji}</span>
              {persona.title}
            </div>
            <div className="mt-0.5 text-xs text-muted">{persona.name}</div>
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange({ id: CUSTOM_ID, name: "", title: "", brief: "" })}
          className={cn(
            "flex items-center gap-2 rounded-xl border border-dashed p-3 text-left text-sm transition-colors",
            value.id === CUSTOM_ID ? "border-accent bg-accent-soft" : "border-border hover:border-accent/50",
          )}
        >
          <UserPlus className="size-4" /> {t.config.customPersona}
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <input
          aria-label={t.config.buyerName}
          placeholder={t.config.buyerName}
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
        />
        <input
          aria-label={t.config.buyerRole}
          placeholder={t.config.buyerRole}
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
        />
      </div>
      <textarea
        aria-label={t.config.buyerBrief}
        placeholder={t.config.buyerBrief}
        value={value.brief}
        onChange={(e) => onChange({ ...value, brief: e.target.value })}
        rows={3}
        className="w-full rounded-lg border border-border bg-background p-3 text-sm"
      />
    </div>
  );
}
