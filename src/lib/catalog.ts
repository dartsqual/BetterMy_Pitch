// Static catalog for the session configurator: buyer personas, difficulty
// levels, sales frameworks and practice languages.

export type Persona = {
  id: string;
  name: string;
  title: string;
  emoji: string;
  brief: string;
};

export const PERSONAS: Persona[] = [
  {
    id: "vp-engineering",
    name: "Dana Reyes",
    title: "Skeptical VP of Engineering",
    emoji: "🛠️",
    brief:
      "Runs a 120-person engineering org. Has been burned by tools that promised a lot and created migration work. Cares about integration effort, reliability, developer adoption and who maintains it. Asks precise technical questions and dislikes marketing language.",
  },
  {
    id: "cfo",
    name: "Marcus Chen",
    title: "Budget-Conscious CFO",
    emoji: "📊",
    brief:
      "Owns a budget that was just cut 15%. Thinks in payback period, total cost of ownership and contract risk. Pushes on pricing, discounts, multi-year commitments and hard ROI numbers. Distrusts vague 'productivity' claims.",
  },
  {
    id: "startup-founder",
    name: "Priya Nair",
    title: "Busy Startup Founder",
    emoji: "🚀",
    brief:
      "Series A founder with 10 minutes between meetings. Wants to know in one sentence why this matters now. Interrupts long answers, compares everything to building it in-house, and moves fast if convinced.",
  },
  {
    id: "security-lead",
    name: "Tomás Alvarez",
    title: "Enterprise Security Lead",
    emoji: "🔐",
    brief:
      "Responsible for vendor risk at a regulated enterprise. Asks about SOC 2, data residency, SSO/SCIM, encryption, sub-processors and incident response. Will block the deal if answers are hand-wavy.",
  },
  {
    id: "procurement",
    name: "Helen Ward",
    title: "Procurement Manager",
    emoji: "📝",
    brief:
      "Measured on savings. Runs a three-vendor comparison, asks for references, payment terms and exit clauses. Polite but relentless about price and terms.",
  },
];

export const DIFFICULTIES = [
  {
    id: "cooperative",
    label: "Cooperative",
    description: "Open and curious. Shares information when asked well.",
  },
  {
    id: "skeptical",
    label: "Skeptical",
    description: "Guarded. Needs proof and pushes back on every claim.",
  },
  {
    id: "hostile",
    label: "Hostile",
    description: "Already prefers a competitor. Interrupts and challenges.",
  },
] as const;

export const FRAMEWORKS = [
  {
    id: "meddic",
    label: "MEDDIC",
    description:
      "Metrics, Economic buyer, Decision criteria, Decision process, Identify pain, Champion.",
  },
  {
    id: "spin",
    label: "SPIN Selling",
    description: "Situation, Problem, Implication and Need-payoff questions.",
  },
  {
    id: "challenger",
    label: "Challenger Sale",
    description: "Teach a new insight, tailor it to the buyer, take control.",
  },
  {
    id: "custom",
    label: "Custom Demo Flow",
    description: "Your own demo agenda or talk track.",
  },
] as const;

export const LANGUAGES = [
  { id: "en", label: "English", speech: "en-US" },
  { id: "pt", label: "Português (BR)", speech: "pt-BR" },
  { id: "es", label: "Español", speech: "es-ES" },
] as const;

export type DifficultyId = (typeof DIFFICULTIES)[number]["id"];
export type FrameworkId = (typeof FRAMEWORKS)[number]["id"];
export type LanguageId = (typeof LANGUAGES)[number]["id"];

export const DIFFICULTY_IDS = DIFFICULTIES.map((d) => d.id) as [
  DifficultyId,
  ...DifficultyId[],
];
export const FRAMEWORK_IDS = FRAMEWORKS.map((f) => f.id) as [
  FrameworkId,
  ...FrameworkId[],
];
export const LANGUAGE_IDS = LANGUAGES.map((l) => l.id) as [
  LanguageId,
  ...LanguageId[],
];

export function frameworkLabel(id: string) {
  return FRAMEWORKS.find((f) => f.id === id)?.label ?? id;
}

export function frameworkDescription(id: string) {
  return FRAMEWORKS.find((f) => f.id === id)?.description ?? "";
}

export function difficultyLabel(id: string) {
  return DIFFICULTIES.find((d) => d.id === id)?.label ?? id;
}

export function languageLabel(id: string) {
  return LANGUAGES.find((l) => l.id === id)?.label ?? "English";
}

export function speechLang(id: string) {
  return LANGUAGES.find((l) => l.id === id)?.speech ?? "en-US";
}
