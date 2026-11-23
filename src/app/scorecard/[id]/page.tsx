import { ScorecardView } from "@/components/ScorecardView";
import { db } from "@/lib/db";
import { ScorecardReport } from "@/lib/schemas";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

/** `id` is the session id: each session has at most one scorecard. */
export default function ScorecardPage({ params }: PageProps<"/scorecard/[id]">) {
  return (
    <Suspense fallback={<div className="h-[70vh] animate-pulse rounded-2xl border border-border bg-card" />}>
      <Scorecard params={params} />
    </Suspense>
  );
}

async function Scorecard({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const session = await db.session.findUnique({
    where: { id },
    include: { scorecard: true, messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!session) notFound();
  if (!session.scorecard) redirect(`/session/${id}`);

  const report = ScorecardReport.parse(JSON.parse(session.scorecard.report));
  return (
    <ScorecardView
      report={report}
      meta={{
        sessionTitle: session.title,
        personaName: session.personaName,
        difficulty: session.difficulty,
        framework: session.framework,
        createdAt: session.createdAt.toISOString(),
        model: session.scorecard.model,
        turns: session.messages.length,
      }}
      transcript={session.messages.map((m) => ({ id: m.id, role: m.role, content: m.content }))}
    />
  );
}
