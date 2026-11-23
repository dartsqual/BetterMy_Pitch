import { ZodError } from "zod";
import { currentStates, sessionMembers } from "./committee";
import { db } from "./db";
import { LLMConfigError } from "./llm";
import { logger } from "./logger";
import type { SessionContext, Turn } from "./prompts";
import { BUYER_ACTIONS, type BuyerAction } from "./schemas";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Uniform JSON error responses for the route handlers. */
export function errorResponse(err: unknown) {
  if (err instanceof ZodError) {
    return Response.json(
      { error: err.issues.map((i) => i.message).join("; "), issues: err.issues },
      { status: 400 },
    );
  }
  if (err instanceof HttpError) return Response.json({ error: err.message }, { status: err.status });
  if (err instanceof LLMConfigError) {
    logger.error({ err }, "llm provider not configured");
    return Response.json({ error: err.message }, { status: 503 });
  }
  logger.error({ err }, "ai request failed");
  const message = err instanceof Error ? err.message : "Unexpected error";
  return Response.json({ error: `AI request failed: ${message}` }, { status: 502 });
}

export async function readJson(req: Request) {
  try {
    return await req.json();
  } catch {
    throw new HttpError(400, "Request body must be JSON");
  }
}

/** Load a session with its transcript and committee state, or throw 404. */
export async function loadSession(sessionId: string) {
  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      decisions: { orderBy: [{ round: "asc" }, { createdAt: "asc" }] },
    },
  });
  if (!session) throw new HttpError(404, "Session not found");
  const ctx: SessionContext = session;
  const members = sessionMembers(session);
  const nameOf = new Map(members.map((m) => [m.id, m.name]));
  const turns: Turn[] = session.messages.map((m) =>
    m.role === "buyer"
      ? { role: "buyer", content: m.content, speaker: (m.speaker && nameOf.get(m.speaker)) || members[0].name }
      : { role: "seller", content: m.content },
  );
  const states = currentStates(
    members,
    session.difficulty,
    session.decisions.map((d) => ({ ...d, action: toAction(d.action) })),
  );
  const round = session.decisions.reduce((max, d) => Math.max(max, d.round), -1) + 1;
  return { session, ctx, turns, members, states, round };
}

export function toAction(value: string): BuyerAction {
  return (BUYER_ACTIONS as readonly string[]).includes(value) ? (value as BuyerAction) : "neutral";
}
