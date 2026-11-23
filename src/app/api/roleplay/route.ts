import { buyerReply } from "@/lib/agents";
import { errorResponse, HttpError, loadSession, readJson } from "@/lib/api";
import { db } from "@/lib/db";
import { RoleplayInput } from "@/lib/schemas";

// POST /api/roleplay — store the seller's turn (if any) and return the buyer's reply.
// With no `message` and an empty transcript, the buyer opens the meeting.
export async function POST(req: Request) {
  try {
    const { sessionId, message } = RoleplayInput.parse(await readJson(req));
    const { session, ctx, turns } = await loadSession(sessionId);
    if (session.status !== "active") throw new HttpError(409, "This session has already been scored");

    if (message) {
      await db.message.create({ data: { sessionId, role: "seller", content: message } });
      turns.push({ role: "seller", content: message });
    } else if (turns.length > 0) {
      throw new HttpError(400, "message is required once the conversation has started");
    }

    const content = await buyerReply(ctx, turns);
    const saved = await db.message.create({ data: { sessionId, role: "buyer", content } });
    return Response.json({
      message: { id: saved.id, role: "buyer", content, createdAt: saved.createdAt },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
