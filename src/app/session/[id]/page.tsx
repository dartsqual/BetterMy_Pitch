import { SessionArena } from "@/components/SessionArena";
import type { HintEntry } from "@/components/LiveCoachSidebar";
import { speechLang } from "@/lib/catalog";
import { db } from "@/lib/db";
import { CoachHint } from "@/lib/schemas";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

export default function SessionPage({ params }: PageProps<"/session/[id]">) {
  return (
    <Suspense fallback={<div className="h-[70vh] animate-pulse rounded-2xl border border-border bg-card" />}>
      <Arena params={params} />
    </Suspense>
  );
}

async function Arena({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const session = await db.session.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!session) notFound();
  if (session.status === "scored") redirect(`/scorecard/${id}`);

  const hints: HintEntry[] = session.messages.flatMap((m) => {
    if (!m.coachHint) return [];
    const parsed = CoachHint.safeParse(JSON.parse(m.coachHint));
    return parsed.success ? [{ messageId: m.id, hint: parsed.data }] : [];
  });

  return (
    <SessionArena
      session={{
        id: session.id,
        title: session.title,
        personaName: session.personaName,
        personaTitle: session.title.split(" · ")[0],
        difficulty: session.difficulty,
        framework: session.framework,
        speechLang: speechLang(session.language),
      }}
      initialMessages={session.messages.map((m) => ({
        id: m.id,
        role: m.role === "buyer" ? "buyer" : "seller",
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      }))}
      initialHints={hints}
    />
  );
}
