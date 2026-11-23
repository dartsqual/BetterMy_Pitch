import { describe, expect, it } from "vitest";
import { toBuyerMessages } from "@/lib/agents";
import { buyerSystemPrompt, evaluatorSystemPrompt, formatTranscript } from "@/lib/prompts";

const ctx = {
  product: "Acme Observability",
  personaName: "Dana Reyes",
  personaBrief: "Skeptical VP of Engineering.",
  difficulty: "hostile",
  framework: "custom",
  customFlow: "1. Agenda 2. Live demo 3. Pricing",
  language: "pt",
};

describe("prompts", () => {
  it("buyer prompt keeps the persona in character and in the chosen language", () => {
    const p = buyerSystemPrompt(ctx);
    expect(p).toContain("Never break character");
    expect(p).toContain("Dana Reyes");
    expect(p).toContain("Português");
    expect(p).toContain("competitor");
  });

  it("evaluator prompt includes the custom demo flow", () => {
    expect(evaluatorSystemPrompt(ctx)).toContain("2. Live demo");
  });

  it("formats the transcript with speaker labels", () => {
    expect(formatTranscript([{ role: "seller", content: "Hi" }, { role: "buyer", content: "Hello" }], ctx)).toBe(
      "SELLER: Hi\nBUYER (Dana Reyes): Hello",
    );
  });
});

describe("toBuyerMessages", () => {
  it("starts with a user turn and alternates roles", () => {
    const msgs = toBuyerMessages([
      { role: "buyer", content: "Hi, what do you have?" },
      { role: "seller", content: "Thanks for the time." },
      { role: "seller", content: "Can I ask about your setup?" },
    ]);
    expect(msgs[0].role).toBe("user");
    expect(msgs.map((m) => m.role)).toEqual(["user", "assistant", "user"]);
    expect(msgs[2].content).toContain("Can I ask about your setup?");
  });
});
