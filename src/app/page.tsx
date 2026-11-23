import { ProgressChart } from "@/components/ProgressChart";
import { SessionConfigurator } from "@/components/SessionConfigurator";
import { Badge, Card, SectionTitle } from "@/components/ui";
import { db } from "@/lib/db";
import { intlLocale } from "@/lib/i18n/dictionaries";
import { getDictionary } from "@/lib/i18n/server";
import { scoreTone } from "@/lib/utils";
import { connection } from "next/server";
import Link from "next/link";
import { Suspense } from "react";

export default function Home() {
  return (
    <div className="space-y-10">
      <Suspense fallback={<div className="h-36" />}>
        <Hero />
      </Suspense>

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

async function Hero() {
  const { t } = await getDictionary();
  return (
    <section className="max-w-3xl space-y-3">
      <Badge>{t.home.badge}</Badge>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t.home.headline}</h1>
      <p className="text-muted">{t.home.intro}</p>
    </section>
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
  const { locale, t } = await getDictionary();
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
        <SectionTitle>{t.home.progress}</SectionTitle>
        {scored.length > 0 ? (
          <ProgressChart
            points={scored}
            locale={intlLocale(locale)}
            labels={{ latest: t.home.latest, best: t.home.best, scored: t.home.scored, chart: t.home.chartLabel }}
          />
        ) : (
          <p className="text-sm text-muted">{t.home.progressEmpty}</p>
        )}
      </Card>

      <Card className="space-y-3">
        <SectionTitle>{t.home.recent}</SectionTitle>
        {sessions.length === 0 && <p className="text-sm text-muted">{t.home.noSessions}</p>}
        <ul className="divide-y divide-border">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link
                href={s.scorecard ? `/scorecard/${s.id}` : `/session/${s.id}`}
                className="flex items-center justify-between gap-3 py-3 hover:opacity-80"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {s.title.split(" · ")[0]} ·{" "}
                    {t.frameworks[s.framework as keyof typeof t.frameworks]?.label ?? s.framework}
                  </div>
                  <div className="text-xs text-muted">
                    {s.personaName} ·{" "}
                    {t.difficulties[s.difficulty as keyof typeof t.difficulties]?.label ?? s.difficulty} ·{" "}
                    {s._count.messages} {t.home.turns} · {s.createdAt.toLocaleDateString(intlLocale(locale))}
                  </div>
                </div>
                {s.scorecard ? (
                  <span className={`text-lg font-semibold tabular-nums ${scoreTone(s.scorecard.overall)}`}>
                    {s.scorecard.overall}
                  </span>
                ) : (
                  <Badge>{t.home.inProgress}</Badge>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
