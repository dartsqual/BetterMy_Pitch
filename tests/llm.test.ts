import { describe, expect, it } from "vitest";
import { z } from "zod";
import { generateObject } from "@/lib/llm";
import { extractJson, toProviderSchema } from "@/lib/llm/json";
import type { LLMProvider } from "@/lib/llm/types";
import { ScorecardReport } from "@/lib/schemas";

describe("extractJson", () => {
  it("parses plain, fenced and chatty JSON", () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
    expect(extractJson('```json\n{"a":2}\n```')).toEqual({ a: 2 });
    expect(extractJson('Sure! Here it is: {"a":3} hope it helps')).toEqual({ a: 3 });
  });

  it("throws when there is no JSON", () => {
    expect(() => extractJson("no json here")).toThrow();
  });
});

describe("toProviderSchema", () => {
  it("produces a strict schema without unsupported keywords", () => {
    const schema = toProviderSchema(ScorecardReport);
    const text = JSON.stringify(schema);
    expect(text).not.toContain('"minimum"');
    expect(text).not.toContain('"maxItems"');
    expect(text).not.toContain("$schema");
    expect(schema.additionalProperties).toBe(false);
    expect(schema.required).toContain("overallScore");
  });
});

describe("generateObject", () => {
  const schema = z.object({ score: z.number().int().min(0).max(100) });

  function fakeProvider(replies: string[]): LLMProvider & { prompts: string[] } {
    const prompts: string[] = [];
    return {
      name: "fake",
      prompts,
      model: () => "fake",
      chat: async () => "",
      json: async ({ prompt }) => {
        prompts.push(prompt);
        return replies.shift() ?? "";
      },
    };
  }

  it("returns validated data", async () => {
    const p = fakeProvider(['{"score": 80}']);
    await expect(
      generateObject({ provider: p, system: "", prompt: "go", schema, schemaName: "s", tier: "eval" }),
    ).resolves.toEqual({ score: 80 });
  });

  it("retries once with the validation error, then succeeds", async () => {
    const p = fakeProvider(['{"score": 150}', '{"score": 90}']);
    const out = await generateObject({ provider: p, system: "", prompt: "go", schema, schemaName: "s", tier: "eval" });
    expect(out).toEqual({ score: 90 });
    expect(p.prompts[1]).toContain("previous answer was invalid");
  });

  it("gives up after two invalid answers", async () => {
    const p = fakeProvider(["nope", '{"score": -1}']);
    await expect(
      generateObject({ provider: p, system: "", prompt: "go", schema, schemaName: "s", tier: "eval" }),
    ).rejects.toThrow(/invalid s/);
  });
});
