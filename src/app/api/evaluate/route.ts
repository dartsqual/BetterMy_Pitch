import { evaluateSession } from "@/lib/agents";
import { errorResponse, HttpError, loadSession, readJson } from "@/lib/api";
import { db } from "@/lib/db";
import { SessionIdInput } from "@/lib/schemas";

// POST /api/evaluate — end the session and generate the structured scorecard.
export async function POST(req: Request) {
  try {
    const { sessionId } = SessionIdInput.parse(await readJson(req));
    const { session, ctx, turns } = await loadSession(sessionId);

    const existing = await db.scorecard.findUnique({ where: { sessionId } });
    if (existing) return Response.json({ scorecardId: existing.id, sessionId });

    if (!turns.some((t) => t.role === "seller")) {
      throw new HttpError(400, "Say at least one thing to the buyer before scoring the session");
    }

    const { report, model } = await evaluateSession(ctx, turns);
    const scorecard = await db.scorecard.create({
      data: { sessionId, overall: report.overallScore, report: JSON.stringify(report), model },
    });
    await db.session.update({
      where: { id: session.id },
      data: { status: "scored", endedAt: new Date() },
    });
    return Response.json({ scorecardId: scorecard.id, sessionId });
  } catch (err) {
    return errorResponse(err);
  }
}
