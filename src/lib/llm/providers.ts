import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { schemaInstruction } from "./json";
import { LLMConfigError, type LLMProvider, type ModelTier } from "./types";

function requireKey(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new LLMConfigError(
      `${name} is not set. Copy .env.example to .env and add your key (or set LLM_PROVIDER="mock" to try the app offline).`,
    );
  }
  return value;
}

// ── OpenRouter (OpenAI-compatible) ───────────────────────────────

export function openRouterProvider(): LLMProvider {
  const client = new OpenAI({
    apiKey: requireKey("OPENROUTER_API_KEY"),
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: { "X-Title": "BetterMy Pitch" },
  });
  const model = (tier: ModelTier) =>
    tier === "eval"
      ? process.env.OPENROUTER_EVAL_MODEL || "anthropic/claude-sonnet-5.5"
      : process.env.OPENROUTER_CHAT_MODEL || "anthropic/claude-haiku-5.5";

  return {
    name: "openrouter",
    model,
    async chat({ system, messages, tier, maxTokens = 400, temperature = 0.8 }) {
      const res = await client.chat.completions.create({
        model: model(tier),
        max_tokens: maxTokens,
        temperature,
        messages: [{ role: "system", content: system }, ...messages],
      });
      return res.choices[0]?.message?.content?.trim() ?? "";
    },
    async json({ system, prompt, schema, schemaName, tier, maxTokens = 4000 }) {
      const base = {
        model: model(tier),
        max_tokens: maxTokens,
        temperature: 0.2,
        messages: [
          { role: "system" as const, content: system },
          { role: "user" as const, content: prompt },
        ],
      };
      try {
        const res = await client.chat.completions.create({
          ...base,
          response_format: {
            type: "json_schema",
            json_schema: { name: schemaName, strict: true, schema },
          },
        });
        return res.choices[0]?.message?.content ?? "";
      } catch (err) {
        // Some models on OpenRouter don't support json_schema: fall back to prompting.
        if (!(err instanceof OpenAI.APIError) || err.status !== 400) throw err;
        const res = await client.chat.completions.create({
          ...base,
          messages: [
            { role: "system", content: system + schemaInstruction(schema) },
            { role: "user", content: prompt },
          ],
        });
        return res.choices[0]?.message?.content ?? "";
      }
    },
  };
}

// ── Anthropic (direct) ───────────────────────────────────────────

export function anthropicProvider(): LLMProvider {
  const client = new Anthropic({ apiKey: requireKey("ANTHROPIC_API_KEY") });
  const model = (tier: ModelTier) =>
    tier === "eval"
      ? process.env.ANTHROPIC_EVAL_MODEL || "claude-sonnet-5-5"
      : process.env.ANTHROPIC_CHAT_MODEL || "claude-haiku-5-5";
  const text = (msg: Anthropic.Message) =>
    msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

  return {
    name: "anthropic",
    model,
    async chat({ system, messages, tier, maxTokens = 400 }) {
      const res = await client.messages.create({
        model: model(tier),
        max_tokens: maxTokens,
        system,
        messages,
      });
      return text(res);
    },
    async json({ system, prompt, schema, tier, maxTokens = 4000 }) {
      const res = await client.messages.create({
        model: model(tier),
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: prompt }],
        output_config: { format: { type: "json_schema", schema } },
      });
      return text(res);
    },
  };
}

// ── Google Gemini (direct) ───────────────────────────────────────

export function geminiProvider(): LLMProvider {
  const ai = new GoogleGenAI({ apiKey: requireKey("GEMINI_API_KEY") });
  const model = (tier: ModelTier) =>
    tier === "eval"
      ? process.env.GEMINI_EVAL_MODEL || "gemini-2.5-flash"
      : process.env.GEMINI_CHAT_MODEL || "gemini-2.5-flash";

  return {
    name: "gemini",
    model,
    async chat({ system, messages, tier, maxTokens = 400, temperature = 0.8 }) {
      const res = await ai.models.generateContent({
        model: model(tier),
        contents: messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        config: { systemInstruction: system, maxOutputTokens: maxTokens, temperature },
      });
      return res.text?.trim() ?? "";
    },
    async json({ system, prompt, schema, tier, maxTokens = 4000 }) {
      const res = await ai.models.generateContent({
        model: model(tier),
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction: system,
          maxOutputTokens: maxTokens,
          temperature: 0.2,
          responseMimeType: "application/json",
          responseJsonSchema: schema,
        },
      });
      return res.text ?? "";
    },
  };
}
