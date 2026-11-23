import { db } from "@/lib/db";
import { connection } from "next/server";

// GET /api/health — liveness + database check (used by Docker and Datadog Synthetics).
export async function GET() {
  await connection();
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", provider: process.env.LLM_PROVIDER ?? "openrouter" });
  } catch {
    return Response.json({ status: "error", db: "unreachable" }, { status: 503 });
  }
}
