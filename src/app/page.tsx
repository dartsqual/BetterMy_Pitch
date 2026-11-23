import { ProgressChart } from "@/components/ProgressChart";
import { SessionConfigurator } from "@/components/SessionConfigurator";
import { Badge, Card, SectionTitle } from "@/components/ui";
import { difficultyLabel } from "@/lib/catalog";
import { db } from "@/lib/db";
import { scoreTone } from "@/lib/utils";
import { connection } from "next/server";
import Link from "next/link";
import { Suspense } from "react";

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="max-w-3xl space-y-3">
        <Badge>AI sales & demo coach</Badge>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Rehearse your pitch against a buyer who pushes back.
        </h1>
        <p className="text-muted">
          Pick a buyer persona and a sales framework, run a live roleplay with silent coaching cues,
          then get a scorecard with quote-level feedback and executive-ready rewrites.
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section id="new" className="scroll-mt-20">
          <Suspense fallback={<Card className="h-96 animate-pulse" />}>
            <Configurator />
          </Suspense>
        </section>
        <section id="history" className="scroll-mt-20 space-y-4">
          <Suspense fallback={<Card className="h-64 animate-pulse" />}>
            <History />
          </Suspense>
        </section>
      </div>
    </div>
  );
}

async function Configurator() {
  await connection();
  const templates = await db.personaTemplate.findMany({ orderBy: { createdAt: "desc" }, take: 12 });
  return (
    <SessionConfigurator
      templates={templates.map(({ id, name, title, brief }) => ({ id, name, title, brief }))}
    />
  );
}

async function History() {
  await connection();
  const sessions = await db.session.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { scorecard: { select: { overall: true } }, _count: { select: { messages: true } } },
  });

  const scored = sessions
    .filter((s) => s.scorecard)
    .map((s) => ({ date: s.createdAt.toISOString(), score: s.scorecard!.overall }))
    .reverse();

  return (
    <>
      <Card className="space-y-3">
        <SectionTitle>Your progress</SectionTitle>
        {scored.length > 0 ? (
          <ProgressChart points={scored} />
        ) : (
          <p className="text-sm text-muted">Score your first session to start tracking readiness over time.</p>
        )}
      </Card>

      <Card className="space-y-3">
        <SectionTitle>Recent sessions</SectionTitle>
        {sessions.length === 0 && <p className="text-sm text-muted">No sessions yet.</p>}
        <ul className="divide-y divide-border">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link
                href={s.scorecard ? `/scorecard/${s.id}` : `/session/${s.id}`}
                className="flex items-center justify-between gap-3 py-3 hover:opacity-80"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{s.title}</div>
                  <div className="text-xs text-muted">
                    {s.personaName} · {difficultyLabel(s.difficulty)} · {s._count.messages} turns ·{" "}
                    {s.createdAt.toLocaleDateString()}
                  </div>
                </div>
                {s.scorecard ? (
                  <span className={`text-lg font-semibold tabular-nums ${scoreTone(s.scorecard.overall)}`}>
                    {s.scorecard.overall}
                  </span>
                ) : (
                  <Badge>In progress</Badge>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
