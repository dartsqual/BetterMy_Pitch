import { ZodError } from "zod";
import { db } from "./db";
import { LLMConfigError } from "./llm";
import type { SessionContext, Turn } from "./prompts";

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
  if (err instanceof LLMConfigError) return Response.json({ error: err.message }, { status: 503 });
  console.error(err);
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

/** Load a session with its transcript, or throw 404. */
export async function loadSession(sessionId: string) {
  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!session) throw new HttpError(404, "Session not found");
  const ctx: SessionContext = session;
  const turns: Turn[] = session.messages.map((m) => ({
    role: m.role === "buyer" ? "buyer" : "seller",
    content: m.content,
  }));
  return { session, ctx, turns };
}
