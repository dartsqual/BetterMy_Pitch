# BetterMy Pitch 🎤

**An AI sales & demo coach.** Rehearse product demos and sales pitches against a realistic AI buyer, get silent coaching cues in real time, and finish every session with a structured scorecard: readiness score, category breakdown, quote-level key moments and executive-ready rewrites.

Built for sales engineers, founders and account executives who want reps before the real call.

## Features

| | |
|---|---|
| **Scenario & persona builder** | Describe your product (or paste deck notes), pick a buyer persona (Skeptical VP of Engineering, Budget-Conscious CFO, Busy Startup Founder, Enterprise Security Lead, Procurement Manager) or write your own and save it as a template. Choose the difficulty (Cooperative / Skeptical / Hostile), sales framework (MEDDIC, SPIN, Challenger, or your custom demo flow) and language (English, Português, Español). |
| **Roleplay arena** | Split screen. **Left:** the buyer simulator stays strictly in character, asks hard technical and commercial questions and raises realistic objections. **Right:** the live coach whisperer reads each buyer turn and suggests 1–2 tactical pivots. |
| **Voice practice** | Browser Web Speech API: dictate your answers with the mic (optionally auto-sent) and have the buyer's replies read aloud. Needs Chrome or Edge; Safari support is partial. Text chat always works. |
| **Scorecard & debrief** | "End & Score Session" runs the evaluator agent on the full transcript and the chosen framework. It returns schema-validated JSON: an overall readiness score (0–100); Discovery, Objection Handling, Value Articulation and Conciseness/Pacing scores; framework coverage; key moments; side-by-side rewrites; next drills. |
| **Bilingual interface** | English and Brazilian Portuguese, switched with the **EN / PT-BR** selector in the header. The choice is saved in a cookie; on the first visit it follows the browser language. The practice language (buyer and feedback) follows the interface by default and can still be set per session. |
| **History & progress** | Sessions, transcripts, coach cues and scorecards are stored in SQLite. The home page charts your readiness score over time. |

## Architecture

```
Browser (Next.js App Router, React 19, Tailwind)
│
│  /                 Session configurator + history/progress
│  /session/[id]     ChatArena (buyer) │ LiveCoachSidebar (coach)   ← Web Speech API
│  /scorecard/[id]   ScorecardView
│
▼  fetch (JSON)
Route Handlers ─────────────────────────────────────────────────────────────
  POST /api/sessions   create session (+ optional persona template)
  POST /api/roleplay   store seller turn → Buyer agent → store buyer reply
  POST /api/hint       Live Coach agent on the latest buyer turn  (structured JSON)
  POST /api/evaluate   Evaluator agent on full transcript → Scorecard (structured JSON)
│                          │
▼                          ▼
Prisma + SQLite        src/lib/agents.ts ── src/lib/prompts.ts (Buyer / Coach / Evaluator)
(Session, Message,         │
 Scorecard,                ▼
 PersonaTemplate)      src/lib/llm  — provider layer
                         ├─ openrouter  (default: Claude Haiku 5.5 chat, Claude Sonnet 5.5 eval)
                         ├─ anthropic   (direct Claude API)
                         ├─ gemini      (@google/genai)
                         └─ mock        (offline, deterministic — for demos & CI)
```

**Structured output.** The coach and evaluator schemas are written once in zod (`src/lib/schemas.ts`). From them the app builds a strict JSON Schema for each provider's native structured-output mode: OpenRouter `json_schema`, Anthropic `output_config.format`, Gemini `responseJsonSchema`. Every reply is validated again with zod. If a reply is invalid, the model gets one retry with the validation error attached. If an OpenRouter model doesn't support `json_schema`, the request falls back to schema-in-prompt.

**Model tiers.** Two tiers. A fast `chat` model handles buyer and coach turns, because latency matters mid-conversation. A stronger `eval` model writes the scorecard.

## Getting started

Requirements: Node.js 20+ (CI uses 24) and npm.

```bash
git clone https://github.com/dartsqual/BetterMy_Pitch.git
cd BetterMy_Pitch
npm install                 # also runs `prisma generate`
cp .env.example .env        # then add your OPENROUTER_API_KEY
npx prisma migrate dev      # creates prisma/dev.db
npm run dev                 # http://localhost:3000
```

> No API key yet? Set `LLM_PROVIDER="mock"` in `.env` to click through the full flow with canned buyer, coach and scorecard replies.

> npm 11+ may print an `allow-scripts` warning. The Prisma install scripts are already approved under `allowScripts` in `package.json`.

### Environment

| Variable | Default | Purpose |
|---|---|---|
| `LLM_PROVIDER` | `openrouter` | `openrouter`, `anthropic`, `gemini` or `mock` |
| `OPENROUTER_API_KEY` | – | Key from https://openrouter.ai/keys |
| `OPENROUTER_CHAT_MODEL` | `anthropic/claude-haiku-5.5` | Buyer + coach model (any OpenRouter model id) |
| `OPENROUTER_EVAL_MODEL` | `anthropic/claude-sonnet-5.5` | Scorecard model |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_CHAT_MODEL` / `ANTHROPIC_EVAL_MODEL` | `claude-haiku-5-5` / `claude-sonnet-5-5` | Direct Anthropic |
| `GEMINI_API_KEY` / `GEMINI_CHAT_MODEL` / `GEMINI_EVAL_MODEL` | `gemini-2.5-flash` | Direct Gemini |
| `DATABASE_URL` | `file:./dev.db` | SQLite file, relative to `prisma/` |

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm test` | Vitest (schemas, prompt builders, JSON extraction, retry logic) |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run db:migrate` / `npm run db:deploy` | Prisma migrations (dev / prod) |

## Project structure

```
prisma/schema.prisma            Session, Message, Scorecard, PersonaTemplate
src/app/page.tsx                Landing + configurator + history/progress
src/app/session/[id]/page.tsx   Live roleplay + coach
src/app/scorecard/[id]/page.tsx Post-session analytics & rewrites
src/app/api/{sessions,roleplay,hint,evaluate}/route.ts
src/components/                 PersonaSelector, SessionConfigurator, SessionArena,
                                ChatArena, LiveCoachSidebar, ScorecardView, ProgressChart, ui
src/lib/prompts.ts              System prompts for Buyer, Coach, Evaluator
src/lib/schemas.ts              zod input/output schemas
src/lib/agents.ts               Buyer / Coach / Evaluator calls
src/lib/llm/                    Provider layer (OpenRouter, Anthropic, Gemini, mock)
src/lib/i18n/                   UI translations (en, pt) + locale cookie helpers
tests/                          Vitest suites
```

## Roadmap

- **Bruin analytics:** ingest sessions and scorecards into a warehouse with a [Bruin](https://getbruin.com) pipeline, for team-level dashboards (score trends per rep, persona and objection type). Moving `DATABASE_URL` to Postgres makes that a direct ingestion.
- Streaming buyer replies, and auth for multi-user teams.
- PDF and PPTX deck upload as product context.
- LLM observability: tracing the three agents and scoring with Datadog LLM Observability.

---

> `nocpilot-legacy/` holds NocPilot, the incident-management template that was in this repository before BetterMy Pitch. It was moved there unchanged; its GitHub workflows are disabled (kept under `nocpilot-legacy/github/`).
