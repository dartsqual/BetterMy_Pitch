import { z } from "zod";
import type { JsonSchema } from "./types";

// Keywords that several providers' structured-output modes reject. The
// constraints are still enforced afterwards by validating with zod.
const UNSUPPORTED = new Set([
  "$schema",
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "minItems",
  "maxItems",
  "minLength",
  "maxLength",
  "pattern",
  "format",
]);

/** Convert a zod schema to a provider-friendly, strict JSON Schema. */
export function toProviderSchema(schema: z.ZodType): JsonSchema {
  const raw = z.toJSONSchema(schema, { target: "draft-7" }) as JsonSchema;
  return sanitize(raw) as JsonSchema;
}

function sanitize(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(sanitize);
  if (!node || typeof node !== "object") return node;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    if (UNSUPPORTED.has(key)) continue;
    out[key] = sanitize(value);
  }
  if (out.type === "object" && out.properties) {
    out.additionalProperties = false;
    out.required = Object.keys(out.properties as object);
  }
  return out;
}

/** Pull the first JSON object out of a model reply (handles code fences / chatter). */
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : text).trim();
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(candidate.slice(start, end + 1));
    throw new Error("Model reply did not contain valid JSON");
  }
}

/** Instructions appended when a provider has no native structured output. */
export function schemaInstruction(schema: JsonSchema) {
  return `\n\nRespond with ONLY a single JSON object (no markdown, no prose) that validates against this JSON Schema:\n${JSON.stringify(schema)}`;
}
