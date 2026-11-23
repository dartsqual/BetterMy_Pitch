import { difficultyLabel, frameworkLabel } from "@/lib/catalog";
import { CATEGORY_KEYS, CATEGORY_LABELS, type ScorecardReport } from "@/lib/schemas";
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

function readinessLabel(score: number) {
  if (score >= 90) return "Exceptional";
  if (score >= 75) return "Ready";
  if (score >= 60) return "Needs polish";
  return "Not ready yet";
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
  const strengths = report.keyMoments.filter((m) => m.type === "strength");
  const misses = report.keyMoments.filter((m) => m.type === "missed_opportunity");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-sm text-muted">
            Scorecard · {new Date(meta.createdAt).toLocaleString()} · {meta.turns} turns
          </div>
          <h1 className="text-2xl font-semibold">{meta.sessionTitle}</h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge>{meta.personaName}</Badge>
            <Badge>{difficultyLabel(meta.difficulty)}</Badge>
            <Badge>{frameworkLabel(meta.framework)}</Badge>
          </div>
        </div>
        <Link
          href="/#new"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white hover:opacity-90"
        >
          <RotateCcw className="size-4" /> Practice again
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card className="flex flex-col items-center justify-center gap-2 text-center">
          <SectionTitle>Overall readiness</SectionTitle>
          <div className={cn("text-7xl font-bold tabular-nums", scoreTone(report.overallScore))}>
            {report.overallScore}
          </div>
          <div className="font-medium">{readinessLabel(report.overallScore)}</div>
          <p className="text-sm text-muted">{report.verdict}</p>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>Category breakdown</SectionTitle>
          {CATEGORY_KEYS.map((key) => {
            const c = report.categories[key];
            return (
              <div key={key} className="space-y-1.5">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium">{CATEGORY_LABELS[key]}</span>
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
            <ThumbsUp className="size-4 text-good" /> What worked
          </SectionTitle>
          {strengths.length === 0 && <p className="text-sm text-muted">No standout moments yet.</p>}
          {strengths.map((m, i) => (
            <Moment key={i} quote={m.quote} speaker={m.speaker} insight={m.insight} tone="good" />
          ))}
        </Card>
        <Card className="space-y-3">
          <SectionTitle className="flex items-center gap-2">
            <TriangleAlert className="size-4 text-warn" /> Missed opportunities
          </SectionTitle>
          {misses.length === 0 && <p className="text-sm text-muted">Nothing major missed.</p>}
          {misses.map((m, i) => (
            <Moment key={i} quote={m.quote} speaker={m.speaker} insight={m.insight} tone="warn" />
          ))}
        </Card>
      </div>

      <Card className="space-y-4">
        <SectionTitle>Actionable rewrites</SectionTitle>
        {report.rewrites.map((r, i) => (
          <div key={i} className="space-y-2">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-bad/30 bg-bad/5 p-3">
                <div className="mb-1 text-xs font-semibold uppercase text-bad">You said</div>
                <p className="text-sm">“{r.original}”</p>
              </div>
              <div className="rounded-xl border border-good/30 bg-good/5 p-3">
                <div className="mb-1 text-xs font-semibold uppercase text-good">Executive-ready</div>
                <p className="text-sm">“{r.improved}”</p>
              </div>
            </div>
            <p className="text-xs text-muted">Why: {r.why}</p>
          </div>
        ))}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <SectionTitle>{frameworkLabel(meta.framework)} coverage</SectionTitle>
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
            <Lightbulb className="size-4 text-accent" /> Next drills
          </SectionTitle>
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            {report.nextDrills.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ol>
        </Card>
      </div>

      <details className="rounded-2xl border border-border bg-card p-5">
        <summary className="cursor-pointer text-sm font-semibold">Full transcript</summary>
        <div className="mt-4 space-y-2 text-sm">
          {transcript.map((m) => (
            <p key={m.id}>
              <span className={cn("font-semibold", m.role === "seller" ? "text-accent" : "text-muted")}>
                {m.role === "seller" ? "You" : meta.personaName}:
              </span>{" "}
              {m.content}
            </p>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted">Scored by {meta.model}</p>
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
