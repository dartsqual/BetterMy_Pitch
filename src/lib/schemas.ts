import { z } from "zod";
import { DIFFICULTY_IDS, FRAMEWORK_IDS, LANGUAGE_IDS } from "./catalog";

// ── API inputs ───────────────────────────────────────────────────

export const CreateSessionInput = z
  .object({
    product: z.string().trim().min(10, "Describe your product in at least 10 characters").max(6000),
    personaId: z.string().min(1),
    personaName: z.string().trim().min(1).max(80),
    personaTitle: z.string().trim().min(1).max(120),
    personaBrief: z.string().trim().min(10).max(2000),
    difficulty: z.enum(DIFFICULTY_IDS),
    framework: z.enum(FRAMEWORK_IDS),
    customFlow: z.string().trim().max(3000).optional(),
    language: z.enum(LANGUAGE_IDS).default("en"),
    saveAsTemplate: z.boolean().optional(),
  })
  .refine((v) => v.framework !== "custom" || (v.customFlow?.length ?? 0) >= 10, {
    message: "Describe your custom demo flow",
    path: ["customFlow"],
  });
export type CreateSessionInput = z.infer<typeof CreateSessionInput>;

export const RoleplayInput = z.object({
  sessionId: z.string().min(1),
  /** Omit to let the buyer open the meeting. */
  message: z.string().trim().min(1).max(4000).optional(),
});

export const SessionIdInput = z.object({ sessionId: z.string().min(1) });

// ── LLM outputs ──────────────────────────────────────────────────

export const CoachHint = z.object({
  signal: z
    .string()
    .describe("What the buyer is really signalling in their latest turn, max 12 words."),
  tips: z
    .array(z.string())
    .min(1)
    .max(2)
    .describe("1–2 punchy tactical tips for the seller's next reply, max 25 words each."),
});
export type CoachHint = z.infer<typeof CoachHint>;

const score = z.number().int().min(0).max(100);

export const CATEGORY_KEYS = [
  "discoveryDepth",
  "objectionHandling",
  "valueArticulation",
  "concisenessPacing",
] as const;

export const CATEGORY_LABELS: Record<(typeof CATEGORY_KEYS)[number], string> = {
  discoveryDepth: "Discovery Depth",
  objectionHandling: "Objection Handling",
  valueArticulation: "Value Articulation",
  concisenessPacing: "Conciseness & Pacing",
};

const Category = z.object({
  score,
  rationale: z.string().describe("One or two sentences grounded in the transcript."),
});

export const ScorecardReport = z.object({
  overallScore: score.describe("Overall readiness score 0–100."),
  verdict: z.string().describe("One-sentence headline verdict on readiness."),
  categories: z.object({
    discoveryDepth: Category,
    objectionHandling: Category,
    valueArticulation: Category,
    concisenessPacing: Category,
  }),
  frameworkCoverage: z
    .array(
      z.object({
        element: z.string().describe("Framework element, e.g. 'Economic buyer' or 'Implication'."),
        covered: z.boolean(),
        note: z.string(),
      }),
    )
    .describe("How well each element of the chosen sales framework was covered."),
  keyMoments: z
    .array(
      z.object({
        type: z.enum(["strength", "missed_opportunity"]),
        quote: z.string().describe("Exact quote from the transcript."),
        speaker: z.enum(["seller", "buyer"]),
        insight: z.string(),
      }),
    )
    .describe("3–6 highlighted moments."),
  rewrites: z
    .array(
      z.object({
        original: z.string().describe("Exact weak seller response from the transcript."),
        improved: z.string().describe("Stronger, executive-ready alternative."),
        why: z.string(),
      }),
    )
    .describe("2–4 side-by-side rewrites of the seller's weakest replies."),
  nextDrills: z.array(z.string()).describe("2–3 concrete drills for the next practice session."),
});
export type ScorecardReport = z.infer<typeof ScorecardReport>;
