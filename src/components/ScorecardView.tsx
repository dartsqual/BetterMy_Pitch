"use client";

import { useI18n } from "@/lib/i18n/client";
import { intlLocale, type Dictionary } from "@/lib/i18n/dictionaries";
import { CATEGORY_KEYS, type ScorecardReport } from "@/lib/schemas";
import { cn, scoreTone } from "@/lib/utils";
import { Check, Lightbulb, RotateCcw, ThumbsUp, TriangleAlert, X } from "lucide-react";
import Link from "next/link";
import { Badge, Card, ScoreBar, SectionTitle } from "./ui";

type Meta = {
  sessionTitle: string;
  personaName: string;
  difficulty: string;
  framework: string;
  createdAt: string;
  model: string;
  turns: number;
};

function readinessLabel(score: number, t: Dictionary) {
  if (score >= 90) return t.scorecard.readiness.exceptional;
  if (score >= 75) return t.scorecard.readiness.ready;
  if (score >= 60) return t.scorecard.readiness.polish;
  return t.scorecard.readiness.notReady;
}

export function ScorecardView({
  report,
  meta,
  transcript,
}: {
  report: ScorecardReport;
  meta: Meta;
  transcript: { id: string; role: string; content: string }[];
}) {
  const { locale, t } = useI18n();
  const frameworkName = t.frameworks[meta.framework as keyof typeof t.frameworks]?.label ?? meta.framework;
  const strengths = report.keyMoments.filter((m) => m.type === "strength");
  const misses = report.keyMoments.filter((m) => m.type === "missed_opportunity");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-sm text-muted">
            {t.scorecard.scorecard} · {new Date(meta.createdAt).toLocaleString(intlLocale(locale))} · {meta.turns} {t.scorecard.turns}
          </div>
          <h1 className="text-2xl font-semibold">
            {meta.sessionTitle.split(" · ")[0]} · {frameworkName}
          </h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge>{meta.personaName}</Badge>
            <Badge>{t.difficulties[meta.difficulty as keyof typeof t.difficulties]?.label ?? meta.difficulty}</Badge>
            <Badge>{frameworkName}</Badge>
          </div>
        </div>
        <Link
          href="/#new"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white hover:opacity-90"
        >
          <RotateCcw className="size-4" /> {t.scorecard.practiceAgain}
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card className="flex flex-col items-center justify-center gap-2 text-center">
          <SectionTitle>{t.scorecard.overall}</SectionTitle>
          <div className={cn("text-7xl font-bold tabular-nums", scoreTone(report.overallScore))}>
            {report.overallScore}
          </div>
          <div className="font-medium">{readinessLabel(report.overallScore, t)}</div>
          <p className="text-sm text-muted">{report.verdict}</p>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>{t.scorecard.breakdown}</SectionTitle>
          {CATEGORY_KEYS.map((key) => {
            const c = report.categories[key];
            return (
              <div key={key} className="space-y-1.5">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium">{t.scorecard.categories[key]}</span>
                  <span className={cn("font-semibold tabular-nums", scoreTone(c.score))}>{c.score}</span>
                </div>
                <ScoreBar score={c.score} />
                <p className="text-xs text-muted">{c.rationale}</p>
              </div>
            );
          })}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <SectionTitle className="flex items-center gap-2">
            <ThumbsUp className="size-4 text-good" /> {t.scorecard.worked}
          </SectionTitle>
          {strengths.length === 0 && <p className="text-sm text-muted">{t.scorecard.noStrengths}</p>}
          {strengths.map((m, i) => (
            <Moment key={i} quote={m.quote} speaker={t.scorecard[m.speaker]} insight={m.insight} tone="good" />
          ))}
        </Card>
        <Card className="space-y-3">
          <SectionTitle className="flex items-center gap-2">
            <TriangleAlert className="size-4 text-warn" /> {t.scorecard.missed}
          </SectionTitle>
          {misses.length === 0 && <p className="text-sm text-muted">{t.scorecard.noMisses}</p>}
          {misses.map((m, i) => (
            <Moment key={i} quote={m.quote} speaker={t.scorecard[m.speaker]} insight={m.insight} tone="warn" />
          ))}
        </Card>
      </div>

      <Card className="space-y-4">
        <SectionTitle>{t.scorecard.rewrites}</SectionTitle>
        {report.rewrites.map((r, i) => (
          <div key={i} className="space-y-2">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-bad/30 bg-bad/5 p-3">
                <div className="mb-1 text-xs font-semibold uppercase text-bad">{t.scorecard.youSaid}</div>
                <p className="text-sm">“{r.original}”</p>
              </div>
              <div className="rounded-xl border border-good/30 bg-good/5 p-3">
                <div className="mb-1 text-xs font-semibold uppercase text-good">{t.scorecard.executive}</div>
                <p className="text-sm">“{r.improved}”</p>
              </div>
            </div>
            <p className="text-xs text-muted">{t.scorecard.why}: {r.why}</p>
          </div>
        ))}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <SectionTitle>
            {frameworkName} · {t.scorecard.coverage}
          </SectionTitle>
          <ul className="space-y-2">
            {report.frameworkCoverage.map((f, i) => (
              <li key={i} className="flex gap-2 text-sm">
                {f.covered ? (
                  <Check className="mt-0.5 size-4 shrink-0 text-good" />
                ) : (
                  <X className="mt-0.5 size-4 shrink-0 text-bad" />
                )}
                <span>
                  <span className="font-medium">{f.element}</span>
                  <span className="text-muted"> — {f.note}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="space-y-3">
          <SectionTitle className="flex items-center gap-2">
            <Lightbulb className="size-4 text-accent" /> {t.scorecard.drills}
          </SectionTitle>
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            {report.nextDrills.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ol>
        </Card>
      </div>

      <details className="rounded-2xl border border-border bg-card p-5">
        <summary className="cursor-pointer text-sm font-semibold">{t.scorecard.transcript}</summary>
        <div className="mt-4 space-y-2 text-sm">
          {transcript.map((m) => (
            <p key={m.id}>
              <span className={cn("font-semibold", m.role === "seller" ? "text-accent" : "text-muted")}>
                {m.role === "seller" ? t.scorecard.you : meta.personaName}:
              </span>{" "}
              {m.content}
            </p>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted">{t.scorecard.scoredBy} {meta.model}</p>
      </details>
    </div>
  );
}

function Moment({
  quote,
  speaker,
  insight,
  tone,
}: {
  quote: string;
  speaker: string;
  insight: string;
  tone: "good" | "warn";
}) {
  return (
    <figure className={cn("border-l-2 pl-3", tone === "good" ? "border-good" : "border-warn")}>
      <blockquote className="text-sm italic">“{quote}”</blockquote>
      <figcaption className="mt-1 text-xs text-muted">
        <span className="font-medium uppercase">{speaker}</span> · {insight}
      </figcaption>
    </figure>
  );
}
