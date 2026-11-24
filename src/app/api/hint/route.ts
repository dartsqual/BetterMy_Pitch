import { coachHint } from "@/lib/agents";
import { errorResponse, HttpError, loadSession, readJson } from "@/lib/api";
import { db } from "@/lib/db";
import { SessionIdInput } from "@/lib/schemas";

// POST /api/hint — live coaching cue for the buyers' latest turn. The coach
// also reads the committee's private state (interest, trust, reasons).
export async function POST(req: Request) {
  try {
    const { sessionId } = SessionIdInput.parse(await readJson(req));
    const { session, ctx, turns, members, states } = await loadSession(sessionId);
    const lastBuyer = [...session.messages].reverse().find((m) => m.role === "buyer");
    if (!lastBuyer) throw new HttpError(400, "No buyer turn to coach yet");

    const hint = await coachHint(ctx, turns, { members, states });
    await db.message.update({ where: { id: lastBuyer.id }, data: { coachHint: JSON.stringify(hint) } });
    return Response.json({ messageId: lastBuyer.id, hint });
  } catch (err) {
    return errorResponse(err);
  }
}
