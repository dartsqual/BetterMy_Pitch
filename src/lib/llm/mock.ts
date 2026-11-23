import type { CoachHint, ScorecardReport } from "../schemas";
import type { LLMProvider } from "./types";

// Offline provider (LLM_PROVIDER="mock"): deterministic canned replies so the
// full UI flow can be explored and tested without an API key.

const BUYER_LINES = [
  "Thanks for making time. I've got about twenty minutes — what problem do you think you solve for us?",
  "We've looked at a couple of tools like this already. What makes yours different, concretely?",
  "That sounds expensive. How would I justify this to my CFO this quarter?",
  "Who else is using this at our scale, and can I talk to them?",
  "How long until my team actually sees value — weeks or months?",
  "Okay. What would a sensible next step look like from your side?",
];

export function mockProvider(): LLMProvider {
  return {
    name: "mock",
    model: () => "mock",
    async chat({ messages }) {
      const buyerTurns = messages.filter((m) => m.role === "assistant").length;
      return BUYER_LINES[buyerTurns % BUYER_LINES.length];
    },
    async json({ schemaName, prompt }) {
      if (schemaName === "coach_hint") {
        const hint: CoachHint = {
          signal: "Testing differentiation and ROI before committing time",
          tips: [
            "Ask what they evaluated before and why it failed before pitching features.",
            "Anchor on time-to-value with one quantified customer outcome.",
          ],
        };
        return JSON.stringify(hint);
      }
      const sellerQuote =
        prompt.match(/SELLER: (.+)/)?.[1]?.slice(0, 160) ?? "(no seller turns yet)";
      const report: ScorecardReport = {
        overallScore: 68,
        verdict: "Solid opener, but discovery was shallow and value stayed generic (mock evaluation).",
        categories: {
          discoveryDepth: { score: 55, rationale: "Few open questions about pain, impact or decision process." },
          objectionHandling: { score: 70, rationale: "Acknowledged objections but rarely confirmed they were resolved." },
          valueArticulation: { score: 65, rationale: "Talked features more than quantified outcomes." },
          concisenessPacing: { score: 80, rationale: "Answers were short and the buyer had room to talk." },
        },
        frameworkCoverage: [
          { element: "Metrics", covered: false, note: "No success metric agreed." },
          { element: "Identify pain", covered: true, note: "Main pain surfaced briefly." },
        ],
        keyMoments: [
          { type: "strength", quote: sellerQuote, speaker: "seller", insight: "Clear, confident opening." },
          {
            type: "missed_opportunity",
            quote: BUYER_LINES[2],
            speaker: "buyer",
            insight: "Price objection was a chance to quantify the cost of doing nothing.",
          },
        ],
        rewrites: [
          {
            original: sellerQuote,
            improved:
              "Before I show anything — what's this costing you today, in hours or revenue? That tells me which 5 minutes of the demo matter.",
            why: "Leads with discovery and earns the right to demo.",
          },
        ],
        nextDrills: [
          "Run the same persona and ask three implication questions before demoing.",
          "Practice a 30-second ROI answer with one customer number.",
        ],
      };
      return JSON.stringify(report);
    },
  };
}
