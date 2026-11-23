// Interface translations. `en` is the source of truth; `pt` must match its shape.

const en = {
  nav: { newSession: "New session", history: "History", language: "Interface language" },
  meta: {
    title: "BetterMy Pitch — AI sales & demo coach",
    description:
      "Rehearse demos and sales pitches against realistic AI buyers, get live coaching cues and a structured scorecard.",
  },
  home: {
    badge: "AI sales & demo coach",
    headline: "Rehearse your pitch against a buyer who pushes back.",
    intro:
      "Pick a buyer persona and a sales framework, run a live roleplay with silent coaching cues, then get a scorecard with quote-level feedback and executive-ready rewrites.",
    progress: "Your progress",
    progressEmpty: "Score your first session to start tracking readiness over time.",
    recent: "Recent sessions",
    noSessions: "No sessions yet.",
    turns: "turns",
    inProgress: "In progress",
    latest: "Latest",
    best: "Best",
    scored: "scored",
    chartLabel: "Readiness score over time",
  },
  config: {
    step1: "1 · What are you pitching?",
    productPlaceholder:
      "Product, value proposition, pricing, proof points… You can paste your pitch deck notes here.",
    step2: "2 · Who are you pitching to?",
    customPersona: "Custom persona",
    buyerName: "Buyer name",
    buyerRole: "Role, e.g. Head of Data",
    buyerBrief: "Background, priorities, typical objections…",
    saveTemplate: "Save this persona as a reusable template",
    step3: "3 · How hard should it be?",
    step4: "4 · Sales framework",
    customFlowPlaceholder:
      "1. Agenda & goals\n2. Discovery: current process\n3. Demo: dashboard → alerting\n4. Pricing & next steps",
    practiceLanguage: "Practice language (buyer & feedback)",
    start: "Start practice session",
    createError: "Could not create the session",
  },
  arena: {
    buyerSimulator: "Buyer simulator",
    voiceOn: "Voice on",
    voiceOff: "Voice off",
    readAloud: "Read buyer replies aloud",
    endAndScore: "End & Score Session",
    scoring: "Scoring…",
    thinking: "is thinking…",
    stopListening: "Stop listening",
    speak: "Speak your reply",
    listening: "Listening…",
    replyPlaceholder: "Your reply to the buyer (Enter to send, Shift+Enter for a new line)",
    send: "Send",
    autoSend: "Send automatically when I stop the mic",
    requestFailed: "Request failed",
  },
  coach: {
    title: "Live coach whisperer",
    onlyYou: "Only you can see this",
    toggle: "Coach",
    paused: "Coaching paused. Turn it back on to get cues after each buyer turn.",
    reading: "Reading the buyer…",
    empty: "Cues appear here after each buyer turn: what the buyer is signalling and how to pivot.",
    earlier: "Earlier cues",
  },
  scorecard: {
    scorecard: "Scorecard",
    turns: "turns",
    practiceAgain: "Practice again",
    overall: "Overall readiness",
    breakdown: "Category breakdown",
    worked: "What worked",
    noStrengths: "No standout moments yet.",
    missed: "Missed opportunities",
    noMisses: "Nothing major missed.",
    rewrites: "Actionable rewrites",
    youSaid: "You said",
    executive: "Executive-ready",
    why: "Why",
    coverage: "coverage",
    drills: "Next drills",
    transcript: "Full transcript",
    you: "You",
    scoredBy: "Scored by",
    seller: "Seller",
    buyer: "Buyer",
    readiness: {
      exceptional: "Exceptional",
      ready: "Ready",
      polish: "Needs polish",
      notReady: "Not ready yet",
    },
    categories: {
      discoveryDepth: "Discovery Depth",
      objectionHandling: "Objection Handling",
      valueArticulation: "Value Articulation",
      concisenessPacing: "Conciseness & Pacing",
    },
  },
  difficulties: {
    cooperative: { label: "Cooperative", description: "Open and curious. Shares information when asked well." },
    skeptical: { label: "Skeptical", description: "Guarded. Needs proof and pushes back on every claim." },
    hostile: { label: "Hostile", description: "Already prefers a competitor. Interrupts and challenges." },
  },
  frameworks: {
    meddic: {
      label: "MEDDIC",
      description: "Metrics, Economic buyer, Decision criteria, Decision process, Identify pain, Champion.",
    },
    spin: { label: "SPIN Selling", description: "Situation, Problem, Implication and Need-payoff questions." },
    challenger: { label: "Challenger Sale", description: "Teach a new insight, tailor it to the buyer, take control." },
    custom: { label: "Custom Demo Flow", description: "Your own demo agenda or talk track." },
  },
  personas: {
    "vp-engineering": {
      title: "Skeptical VP of Engineering",
      brief:
        "Runs a 120-person engineering org. Has been burned by tools that promised a lot and created migration work. Cares about integration effort, reliability, developer adoption and who maintains it. Asks precise technical questions and dislikes marketing language.",
    },
    cfo: {
      title: "Budget-Conscious CFO",
      brief:
        "Owns a budget that was just cut 15%. Thinks in payback period, total cost of ownership and contract risk. Pushes on pricing, discounts, multi-year commitments and hard ROI numbers. Distrusts vague 'productivity' claims.",
    },
    "startup-founder": {
      title: "Busy Startup Founder",
      brief:
        "Series A founder with 10 minutes between meetings. Wants to know in one sentence why this matters now. Interrupts long answers, compares everything to building it in-house, and moves fast if convinced.",
    },
    "security-lead": {
      title: "Enterprise Security Lead",
      brief:
        "Responsible for vendor risk at a regulated enterprise. Asks about SOC 2, data residency, SSO/SCIM, encryption, sub-processors and incident response. Will block the deal if answers are hand-wavy.",
    },
    procurement: {
      title: "Procurement Manager",
      brief:
        "Measured on savings. Runs a three-vendor comparison, asks for references, payment terms and exit clauses. Polite but relentless about price and terms.",
    },
  } as Record<string, { title: string; brief: string }>,
};

export type Dictionary = typeof en;

const pt: Dictionary = {
  nav: { newSession: "Nova sessão", history: "Histórico", language: "Idioma da interface" },
  meta: {
    title: "BetterMy Pitch — coach de vendas e demos com IA",
    description:
      "Ensaie demos e pitches de vendas com compradores de IA realistas, receba dicas ao vivo e um scorecard estruturado.",
  },
  home: {
    badge: "Coach de vendas e demos com IA",
    headline: "Ensaie seu pitch com um comprador que rebate.",
    intro:
      "Escolha uma persona de comprador e uma metodologia de vendas, faça um roleplay ao vivo com dicas silenciosas do coach e receba um scorecard com feedback citando suas falas e reescritas de nível executivo.",
    progress: "Sua evolução",
    progressEmpty: "Avalie sua primeira sessão para acompanhar sua prontidão ao longo do tempo.",
    recent: "Sessões recentes",
    noSessions: "Nenhuma sessão ainda.",
    turns: "falas",
    inProgress: "Em andamento",
    latest: "Última",
    best: "Melhor",
    scored: "avaliadas",
    chartLabel: "Nota de prontidão ao longo do tempo",
  },
  config: {
    step1: "1 · O que você está apresentando?",
    productPlaceholder:
      "Produto, proposta de valor, preço, provas… Você pode colar aqui as notas do seu pitch deck.",
    step2: "2 · Para quem você está apresentando?",
    customPersona: "Persona personalizada",
    buyerName: "Nome do comprador",
    buyerRole: "Cargo, ex.: Head de Dados",
    buyerBrief: "Contexto, prioridades, objeções típicas…",
    saveTemplate: "Salvar esta persona como modelo reutilizável",
    step3: "3 · Qual o nível de dificuldade?",
    step4: "4 · Metodologia de vendas",
    customFlowPlaceholder:
      "1. Agenda e objetivos\n2. Discovery: processo atual\n3. Demo: dashboard → alertas\n4. Preço e próximos passos",
    practiceLanguage: "Idioma do treino (comprador e feedback)",
    start: "Iniciar sessão de treino",
    createError: "Não foi possível criar a sessão",
  },
  arena: {
    buyerSimulator: "Simulador de comprador",
    voiceOn: "Voz ligada",
    voiceOff: "Voz desligada",
    readAloud: "Ler as respostas do comprador em voz alta",
    endAndScore: "Encerrar e avaliar",
    scoring: "Avaliando…",
    thinking: "está pensando…",
    stopListening: "Parar de ouvir",
    speak: "Fale sua resposta",
    listening: "Ouvindo…",
    replyPlaceholder: "Sua resposta ao comprador (Enter para enviar, Shift+Enter para nova linha)",
    send: "Enviar",
    autoSend: "Enviar automaticamente quando eu desligar o microfone",
    requestFailed: "A requisição falhou",
  },
  coach: {
    title: "Coach ao vivo",
    onlyYou: "Só você vê isto",
    toggle: "Coach",
    paused: "Coach pausado. Ative de novo para receber dicas após cada fala do comprador.",
    reading: "Lendo o comprador…",
    empty: "As dicas aparecem aqui após cada fala do comprador: o que ele está sinalizando e como reagir.",
    earlier: "Dicas anteriores",
  },
  scorecard: {
    scorecard: "Scorecard",
    turns: "falas",
    practiceAgain: "Treinar de novo",
    overall: "Prontidão geral",
    breakdown: "Notas por categoria",
    worked: "O que funcionou",
    noStrengths: "Nenhum momento de destaque ainda.",
    missed: "Oportunidades perdidas",
    noMisses: "Nada importante perdido.",
    rewrites: "Reescritas sugeridas",
    youSaid: "Você disse",
    executive: "Nível executivo",
    why: "Por quê",
    coverage: "cobertura",
    drills: "Próximos exercícios",
    transcript: "Transcrição completa",
    you: "Você",
    scoredBy: "Avaliado por",
    seller: "Vendedor",
    buyer: "Comprador",
    readiness: {
      exceptional: "Excepcional",
      ready: "Pronto",
      polish: "Precisa de ajustes",
      notReady: "Ainda não está pronto",
    },
    categories: {
      discoveryDepth: "Profundidade do discovery",
      objectionHandling: "Tratamento de objeções",
      valueArticulation: "Articulação de valor",
      concisenessPacing: "Concisão e ritmo",
    },
  },
  difficulties: {
    cooperative: { label: "Cooperativo", description: "Aberto e curioso. Compartilha informações quando bem perguntado." },
    skeptical: { label: "Cético", description: "Desconfiado. Pede provas e rebate cada afirmação." },
    hostile: { label: "Hostil", description: "Já prefere um concorrente. Interrompe e desafia." },
  },
  frameworks: {
    meddic: {
      label: "MEDDIC",
      description:
        "Métricas, Comprador econômico, Critérios de decisão, Processo de decisão, Identificar a dor, Campeão.",
    },
    spin: { label: "SPIN Selling", description: "Perguntas de Situação, Problema, Implicação e Necessidade de solução." },
    challenger: {
      label: "Challenger Sale",
      description: "Ensine um novo insight, adapte ao comprador e assuma o controle.",
    },
    custom: { label: "Roteiro de demo próprio", description: "Sua própria agenda de demo ou roteiro de conversa." },
  },
  personas: {
    "vp-engineering": {
      title: "VP de Engenharia cético",
      brief:
        "Lidera uma engenharia de 120 pessoas. Já se queimou com ferramentas que prometeram muito e geraram trabalho de migração. Se importa com esforço de integração, confiabilidade, adoção pelos devs e quem vai manter. Faz perguntas técnicas precisas e detesta linguagem de marketing.",
    },
    cfo: {
      title: "CFO focado em orçamento",
      brief:
        "Teve o orçamento cortado em 15%. Pensa em payback, custo total de propriedade e risco contratual. Pressiona por preço, descontos, compromissos plurianuais e números concretos de ROI. Desconfia de promessas vagas de 'produtividade'.",
    },
    "startup-founder": {
      title: "Fundadora de startup ocupada",
      brief:
        "Fundadora de startup Série A com 10 minutos entre reuniões. Quer saber em uma frase por que isso importa agora. Interrompe respostas longas, compara tudo com construir internamente e decide rápido se for convencida.",
    },
    "security-lead": {
      title: "Líder de Segurança corporativa",
      brief:
        "Responsável por risco de fornecedores numa empresa regulada. Pergunta sobre SOC 2, residência de dados, SSO/SCIM, criptografia, suboperadores e resposta a incidentes. Bloqueia o negócio se as respostas forem vagas.",
    },
    procurement: {
      title: "Gerente de Compras",
      brief:
        "É medida por economia. Faz comparação entre três fornecedores, pede referências, condições de pagamento e cláusulas de saída. Educada, mas implacável com preço e condições.",
    },
  },
};

export const LOCALES = ["en", "pt"] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_COOKIE = "bmp-locale";

export const dictionaries: Record<Locale, Dictionary> = { en, pt };

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "pt";
}

/** BCP-47 tag for dates/numbers. */
export function intlLocale(locale: Locale) {
  return locale === "pt" ? "pt-BR" : "en-US";
}
