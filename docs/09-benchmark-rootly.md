# Benchmark: Rootly vs. nosso stack

Comparação módulo a módulo entre a [Rootly](https://rootly.com/) — plataforma
"AI-native" de incident management (on-call + resposta em Slack/Teams + AI SRE +
retrospectivas + status page) — e o stack da Sunny: **kit GitHub** (registro e
orquestração) + **GoAlert** (on-call) + **RootPilot** (diagnóstico, doc 08) +
**Upptime** (status page, planejado).

> Análise de **11/07/2026** com base no site público da Rootly. A Rootly serve
> aqui como benchmark de paridade de recursos e validação de mercado — é o
> concorrente comercial mais próximo do que o NOC da Sunny entrega.

## O que a Rootly oferece (módulos)

| Módulo | O que faz |
|---|---|
| **On-Call** | Escalas com IA, alerting, app mobile, paging com 99,99% de uptime |
| **Incident Response** | War-room no Slack/Teams, assistente `@Rootly` (scribe, resumos, sugestões), templates de workflow, comunicação multi-canal |
| **AI SRE** | RCA automática ao disparar o alerta: hipóteses paralelas sobre código/telemetria/incidentes passados, causa provável com confidence score, sugestão de fix, MCP server no IDE |
| **Retrospectives** | Timeline auto-gerada, documento colaborativo, action items sincronizados com Jira |
| **Status Page** | Página pública de status para clientes |
| **Catalog** | Organização de serviços e times |
| **Workflows** | Automação no-code por templates |
| **On-Call Health** | Analytics de plantão (MTTA/MTTR, carga) |
| Plataforma | Terraform provider, API, SOC2, promessa de "zero training" nos dados do cliente |

## Paridade: o que já temos

| Módulo Rootly | Nosso equivalente | Nota |
|---|---|---|
| Registro com timeline | Issue + timeline nativa | Empate; a nossa é auditável e ligada ao código |
| Severidades, tipos, formulários | Issue type `Incident` + labels `sevN` + issue forms | ✅ |
| Workflows de automação | Os workflows de Actions do kit | Deles: no-code em UI. Nosso: YAML versionado — pior para não-dev configurar, melhor para auditar e replicar por cliente |
| Ingestão de alertas + dedup | `incident-ingest.yml` (fingerprint) | ✅ |
| On-call / escalonamento | Adapter `page-oncall` + GoAlert (ou PD/Opsgenie do cliente) | ✅ funcional; gap de polish abaixo |
| Retrospectivas (mecânica) | `/postmortem` + sub-issue + template blameless | Auto-preenchimento por IA é gap |
| Action items | Sub-issues do incidente | **Melhor** que o sync Jira deles: a ação corretiva vive junto do código que a corrige |
| Board / acompanhamento | Project org-level + views + Insights | ✅ |
| Config como código | **Tudo já é código por natureza** | Nosso ponto mais forte; a Rootly precisa de Terraform provider para virar código |
| **Multi-cliente** | Repo por cliente + Project consolidado + GitHub App (fase 3) | A Rootly é para o time interno de **uma** empresa; nosso desenho MSP/NOC multi-tenant é diferencial que ela não tem |

## Gaps: o que a Rootly faz e nós ainda não

| Recurso Rootly | Status no nosso design | Prioridade |
|---|---|---|
| **AI SRE** (RCA automática, hipóteses, confidence scores) | Mapeamento 1:1 com o **RootPilot** (ADR-0028 deles é exatamente isso) — planejado no doc 08, não implementado. A Rootly valida que este é o módulo de maior valor do mercado | 🔴 alta |
| **War-room Slack bidirecional** (canal automático, comandos e scribe no Slack) | **Era o único gap sem plano — agora no roadmap do doc 07 (nível 2)**. Nosso Slack é one-way; comandos são na issue | 🔴 alta |
| **Status page** pública | Mitigação planejada: Upptime por cliente (docs 01/07), não implantado | 🟡 média — barato, alto valor percebido |
| On-call com **app mobile** e SLA 99,99% | GoAlert cobre escala/escalonamento/SMS/voz, sem app mobile polido; a confiabilidade do paging é **nossa responsabilidade operacional** (HA do GoAlert + Twilio), não SLA de vendor | 🟡 média |
| Comunicação multi-canal com stakeholders | Parcial (só Slack); caminho: `projects_v2_status_update` + backend fase 3 | 🟡 média |
| **Catalog** de serviços/times | Embrionário (dropdown do form); `runbooks/index.yml` do nível 2 é o começo | 🟢 baixa |
| Analytics prontos (MTTA/MTTR, On-Call Health) | Fase 3 (backend da GitHub App); hoje só Insights do Project | 🟡 média |
| Timeline/retro **auto-geradas por IA** | Nível 4 do doc 07 / write tool do RootPilot | 🟢 baixa (vem com o RootPilot) |
| UI para não-engenheiros | Gap estrutural — GitHub é interface de engenheiro; o dashboard da fase 3 é a resposta para exec/CS | 🟡 média |
| SOC2 / suporte enterprise / SLA de vendor | Não se aplica ao kit interno; relevante se a Sunny vender o NOC como produto | — |

## Leitura estratégica

1. **O stack da Sunny é uma "Rootly aberta, self-hosted e multi-cliente".**
   Issues (registro) + GoAlert (on-call) + RootPilot (AI SRE) + Upptime (status
   page) cobre os quatro módulos núcleo — com custo de licença ~zero e código
   auditável.
2. **O argumento de dados é nosso.** A Rootly é um SaaS que vê todos os
   incidentes e telemetria do cliente, e neutraliza isso prometendo "zero
   training". A arquitetura RootPilot inverte o jogo: credenciais e dados
   privilegiados nunca saem da infra do cliente. Para comprador
   security-conscious, é feature de venda.
3. **O modelo de cobrança é estruturalmente diferente.** Rootly cobra por
   assento; o custo do nosso stack é operação (GoAlert/Twilio/fase 3) +
   investigations do RootPilot — margem melhor em escala de MSP.
4. **Ordem de ataque dos gaps** (impacto no dia a dia): war-room Slack
   bidirecional → AI SRE via RootPilot (fecha a paridade com o produto núcleo
   deles) → Upptime.

## Fontes

- [rootly.com](https://rootly.com/) · [Rootly AI SRE](https://rootly.com/ai-sre) · [Rootly pricing](https://rootly.com/pricing)
- Comparar com: [estudo de viabilidade](../estudo-github-gestao-de-incidentes.md) (seção 6, GitHub vs. ferramentas dedicadas)
