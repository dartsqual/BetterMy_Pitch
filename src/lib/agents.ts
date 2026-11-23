// The three agents: Buyer (roleplay), Live Coach (hints) and Evaluator (scorecard).
import { generateObject, getProvider, type ChatMessage, type LLMProvider } from "./llm";
import {
  buyerOpeningInstruction,
  buyerSystemPrompt,
  coachSystemPrompt,
  evaluatorSystemPrompt,
  formatTranscript,
  type SessionContext,
  type Turn,
} from "./prompts";
import { CoachHint, ScorecardReport } from "./schemas";

/** Map transcript turns to chat messages from the buyer model's point of view. */
export function toBuyerMessages(turns: Turn[]): ChatMessage[] {
  // Providers require the conversation to start with a user turn, so the
  // opening instruction is always the first message.
  const messages: ChatMessage[] = [{ role: "user", content: buyerOpeningInstruction() }];
  for (const turn of turns) {
    const role = turn.role === "seller" ? "user" : "assistant";
    const last = messages[messages.length - 1];
    if (last.role === role) last.content += `\n\n${turn.content}`;
    else messages.push({ role, content: turn.content });
  }
  return messages;
}

export async function buyerReply(ctx: SessionContext, turns: Turn[], provider?: LLMProvider) {
  const p = provider ?? getProvider();
  const reply = await p.chat({
    system: buyerSystemPrompt(ctx),
    messages: toBuyerMessages(turns),
    tier: "chat",
    maxTokens: 350,
  });
  return reply || "Sorry — could you say that again?";
}

export async function coachHint(ctx: SessionContext, turns: Turn[], provider?: LLMProvider) {
  return generateObject({
    provider,
    system: coachSystemPrompt(ctx),
    prompt: `Conversation so far:\n${formatTranscript(turns.slice(-12), ctx)}\n\nCoach the seller's next reply.`,
    schema: CoachHint,
    schemaName: "coach_hint",
    tier: "chat",
    maxTokens: 400,
  });
}

export async function evaluateSession(ctx: SessionContext, turns: Turn[], provider?: LLMProvider) {
  const p = provider ?? getProvider();
  const report = await generateObject({
    provider: p,
    system: evaluatorSystemPrompt(ctx),
    prompt: `Full transcript:\n${formatTranscript(turns, ctx)}\n\nScore this session.`,
    schema: ScorecardReport,
    schemaName: "scorecard",
    tier: "eval",
    maxTokens: 6000,
  });
  return { report, model: p.model("eval") };
}
