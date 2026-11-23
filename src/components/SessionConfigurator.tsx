"use client";

import { DIFFICULTIES, FRAMEWORKS, LANGUAGES, PERSONAS } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { Loader2, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PersonaSelector, type PersonaDraft, type PersonaTemplateDto } from "./PersonaSelector";
import { Button, Card, SectionTitle } from "./ui";

const first = PERSONAS[0];

export function SessionConfigurator({ templates }: { templates: PersonaTemplateDto[] }) {
  const router = useRouter();
  const [product, setProduct] = useState("");
  const [persona, setPersona] = useState<PersonaDraft>({
    id: first.id,
    name: first.name,
    title: first.title,
    brief: first.brief,
  });
  const [difficulty, setDifficulty] = useState<string>("skeptical");
  const [framework, setFramework] = useState<string>("meddic");
  const [customFlow, setCustomFlow] = useState("");
  const [language, setLanguage] = useState<string>("en");
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCustomPersona = persona.id === "custom";

  async function start(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product,
          personaId: persona.id,
          personaName: persona.name,
          personaTitle: persona.title,
          personaBrief: persona.brief,
          difficulty,
          framework,
          customFlow: framework === "custom" ? customFlow : undefined,
          language,
          saveAsTemplate: isCustomPersona && saveAsTemplate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create the session");
      router.push(`/session/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPending(false);
    }
  }

  return (
    <form onSubmit={start} className="space-y-5">
      <Card className="space-y-3">
        <SectionTitle>1 · What are you pitching?</SectionTitle>
        <textarea
          required
          minLength={10}
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          rows={5}
          placeholder="Product, value proposition, pricing, proof points… You can paste your pitch deck notes here."
          className="w-full rounded-lg border border-border bg-background p-3 text-sm"
        />
      </Card>

      <Card className="space-y-3">
        <SectionTitle>2 · Who are you pitching to?</SectionTitle>
        <PersonaSelector value={persona} onChange={setPersona} templates={templates} />
        {isCustomPersona && (
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={saveAsTemplate} onChange={(e) => setSaveAsTemplate(e.target.checked)} />
            Save this persona as a reusable template
          </label>
        )}
      </Card>

      <Card className="space-y-4">
        <SectionTitle>3 · How hard should it be?</SectionTitle>
        <div className="grid gap-2 sm:grid-cols-3">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDifficulty(d.id)}
              className={cn(
                "rounded-xl border p-3 text-left",
                difficulty === d.id ? "border-accent bg-accent-soft" : "border-border hover:border-accent/50",
              )}
            >
              <div className="text-sm font-medium">{d.label}</div>
              <div className="mt-0.5 text-xs text-muted">{d.description}</div>
            </button>
          ))}
        </div>

        <SectionTitle>4 · Sales framework</SectionTitle>
        <div className="grid gap-2 sm:grid-cols-2">
          {FRAMEWORKS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFramework(f.id)}
              className={cn(
                "rounded-xl border p-3 text-left",
                framework === f.id ? "border-accent bg-accent-soft" : "border-border hover:border-accent/50",
              )}
            >
              <div className="text-sm font-medium">{f.label}</div>
              <div className="mt-0.5 text-xs text-muted">{f.description}</div>
            </button>
          ))}
        </div>
        {framework === "custom" && (
          <textarea
            required
            value={customFlow}
            onChange={(e) => setCustomFlow(e.target.value)}
            rows={4}
            placeholder={"1. Agenda & goals\n2. Discovery: current process\n3. Demo: dashboard → alerting\n4. Pricing & next steps"}
            className="w-full rounded-lg border border-border bg-background p-3 text-sm"
          />
        )}

        <div className="flex flex-wrap items-center gap-3">
          <SectionTitle>Language</SectionTitle>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="h-9 rounded-lg border border-border bg-background px-2 text-sm"
          >
            {LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {error && <p className="rounded-lg bg-bad/10 p-3 text-sm text-bad">{error}</p>}
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
        Start practice session
      </Button>
    </form>
  );
}
