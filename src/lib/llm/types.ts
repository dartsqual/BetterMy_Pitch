export type ChatMessage = { role: "user" | "assistant"; content: string };

/** "chat" = low-latency model (buyer + coach); "eval" = stronger model (scorecard). */
export type ModelTier = "chat" | "eval";

export type JsonSchema = Record<string, unknown>;

export interface LLMProvider {
  readonly name: string;
  model(tier: ModelTier): string;
  chat(args: {
    system: string;
    messages: ChatMessage[];
    tier: ModelTier;
    maxTokens?: number;
    temperature?: number;
  }): Promise<string>;
  /** Returns raw JSON text that should conform to `schema`. */
  json(args: {
    system: string;
    prompt: string;
    schema: JsonSchema;
    schemaName: string;
    tier: ModelTier;
    maxTokens?: number;
  }): Promise<string>;
}

export class LLMConfigError extends Error {}
