import type { z } from "zod";
import { extractJson, toProviderSchema } from "./json";
import { mockProvider } from "./mock";
import { anthropicProvider, geminiProvider, openRouterProvider } from "./providers";
import { LLMConfigError, type LLMProvider, type ModelTier } from "./types";

export { LLMConfigError };
export type { ChatMessage, LLMProvider, ModelTier } from "./types";

let cached: LLMProvider | undefined;

export function getProvider(): LLMProvider {
  if (cached) return cached;
  const name = (process.env.LLM_PROVIDER || "openrouter").toLowerCase();
  switch (name) {
    case "openrouter":
      cached = openRouterProvider();
      break;
    case "anthropic":
      cached = anthropicProvider();
      break;
    case "gemini":
      cached = geminiProvider();
      break;
    case "mock":
      cached = mockProvider();
      break;
    default:
      throw new LLMConfigError(
        `Unknown LLM_PROVIDER "${name}". Use openrouter, anthropic, gemini or mock.`,
      );
  }
  return cached;
}

/**
 * Ask the provider for structured output and validate it with zod. On a
 * validation failure the model gets one retry with the error attached.
 */
export async function generateObject<S extends z.ZodType>(args: {
  provider?: LLMProvider;
  system: string;
  prompt: string;
  schema: S;
  schemaName: string;
  tier: ModelTier;
  maxTokens?: number;
}): Promise<z.infer<S>> {
  const provider = args.provider ?? getProvider();
  const jsonSchema = toProviderSchema(args.schema);
  let prompt = args.prompt;
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await provider.json({
      system: args.system,
      prompt,
      schema: jsonSchema,
      schemaName: args.schemaName,
      tier: args.tier,
      maxTokens: args.maxTokens,
    });
    try {
      const parsed = args.schema.safeParse(extractJson(raw));
      if (parsed.success) return parsed.data;
      lastError = parsed.error;
    } catch (err) {
      lastError = err;
    }
    prompt = `${args.prompt}\n\nYour previous answer was invalid (${String(
      lastError,
    ).slice(0, 500)}). Return a corrected JSON object only.`;
  }
  throw new Error(`Model returned invalid ${args.schemaName}: ${String(lastError)}`);
}
