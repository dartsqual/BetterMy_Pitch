import { coachHint } from "@/lib/agents";
import { errorResponse, HttpError, loadSession, readJson } from "@/lib/api";
import { db } from "@/lib/db";
import { SessionIdInput } from "@/lib/schemas";

// POST /api/hint — live coaching cue for the buyer's latest turn.
export async function POST(req: Request) {
  try {
    const { sessionId } = SessionIdInput.parse(await readJson(req));
    const { session, ctx, turns } = await loadSession(sessionId);
    const lastBuyer = [...session.messages].reverse().find((m) => m.role === "buyer");
    if (!lastBuyer) throw new HttpError(400, "No buyer turn to coach yet");

    const hint = await coachHint(ctx, turns);
    await db.message.update({ where: { id: lastBuyer.id }, data: { coachHint: JSON.stringify(hint) } });
    return Response.json({ messageId: lastBuyer.id, hint });
  } catch (err) {
    return errorResponse(err);
  }
}
