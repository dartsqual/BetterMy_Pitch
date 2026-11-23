# Desenho do piloto

Como tirar o NocPilot do papel com o primeiro cliente real: perfil de seleção,
escopo, contrato, pré-requisitos, operação, métricas e critérios de go/no-go.
O piloto não é prova de conceito técnica — o kit funciona. É o experimento que
**valida ou derruba as teses de negócio** acumuladas nos docs 07–12, com
instrumentação definida antes do go-live.

> Desenho de **11/07/2026**. Duração: **90 dias** de operação plena (alinhado
> com a revisão de preços do [doc 12 §9](12-unit-economics.md)). Decisões que
> ficam com a Sunny estão marcadas como **[DECISÃO]**.

## 1. O que o piloto testa

Cada tese tem critério de validação definido **antes** — para o dia 90 ser
leitura de dados, não debate.

| # | Tese (origem) | Métrica | Alvo | Instrumento |
|---|---|---|---|---|
| T1 | O kit sustenta um NOC real com disciplina de registro (doc 01) | % de incidentes com timeline completa (abertura → resolução → causa) | > 90% | Auditoria amostral das issues |
| T2 | Dedup segura tempestades de alerta (doc 07) | Taxa de ruído absorvido sem virar issue nova | > 60% dos alertas | Comentários de fingerprint ÷ alertas no `incident-ingest.yml` |
| T3 | Diagnóstico automático corta minutos humanos (doc 08; premissa −40% no doc 12) | Minutos humanos por Sev1/Sev2, com vs. sem RootPilot | −30% ou mais | Campo de tempo no `/resolve` (§5, item 4) |
| T4 | Catálogo enxuto de conectores cobre a maioria dos incidentes (doc 11) | % de incidentes diagnosticáveis com os 5–6 conectores da fase A | > 80% | Label `conector:faltante` quando o diagnóstico esbarrar em sistema fora do catálogo |
| T5 | As premissas do modelo econômico seguram (doc 12) | Mix de severidade, volume e minutos humanos vs. §2 do doc 12 | Dentro de ±30% | Tabela do doc 12 §9, recalculada mensalmente |
| T6 | O cliente percebe e paga o valor | Renovação a preço de tabela no dia 90; QBR mensal avaliado | Renova (ou aceita a âncora) | Conversa estruturada de QBR + proposta de renovação |
| T7 | Credencial local importa na venda (doc 11) | Objeções de segurança levantadas e respondidas pelo desenho runner-local | Qualitativo | Registro das perguntas de security review do cliente |

T3 e T7 são **condicionais à disponibilidade do runner do RootPilot** — se a
PRD-022 não estiver entregue, o piloto roda níveis 0–2 e essas teses ficam
para o segundo ciclo (§10, risco 2). O piloto **não bloqueia** no RootPilot.

## 2. Perfil do cliente-alvo

**[DECISÃO]** — a escolha do cliente é da Sunny; estes são os critérios.

**Perfil ideal:**

- **Já é cliente da Sunny** — confiança estabelecida e acesso à infra encurtam
  o onboarding; o piloto testa o produto, não a prospecção.
- **Stack heterogêneo que exercita o catálogo fase A**: 1–2 nuvens (AWS
  idealmente), observabilidade existente (Datadog **ou** Grafana — o conector
  que o cliente já tem define a escolha), Cloudflare e GitHub. Quanto mais o
  stack real casa com os conectores T1 do doc 11, mais limpa a leitura de T4.
- **Volume tier M** (~30–60 alertas/mês): S demais não gera dados em 90 dias;
  L demais arrisca a operação no primeiro cliente.
- **Usa Slack** (war-room) e aceita o modelo `incidents-<cliente>` na org da
  Sunny (doc 01).
- **Bônus, não bloqueante**: cliente regulado ou security-conscious — testa T7
  e alimenta a futura frente de compliance.

**Anti-perfil (adiar, não forçar):**

- Exige **assento 24/7 dedicado** em contrato — degrau de 4,2 FTEs que o doc
  12 §5 manda recusar antes de ~R$ 60–70k de MRR.
- Exige integração com PSA/ITSM (ConnectWise, Jira SM) já no piloto — fora de
  escopo (§4).
- Stack dominado por sistemas T4 do doc 11 (ex.: shop 100% Microsoft 365) —
  o diagnóstico automático nasceria manco e contaminaria T3/T4.

**Segundo piloto** (planejar desde já): perfil deliberadamente diferente do
primeiro — um cliente âncora único enviesa as premissas do modelo; não
generalizar pricing com N=1.

## 3. Escopo

**Dentro:**

| Item | Nível (doc 07) | Nota |
|---|---|---|
| Registro disciplinado (issues, comandos, postmortem) | 0 | Kit atual |
| Ingestão de alertas + dedup | 1 | Datadog webhook direto ou Alertmanager via relay |
| Paging GoAlert (Sev1/Sev2) + resolve | 2 | Caminho crítico: monitoramento → GoAlert **direto** |
| Enriquecimento do triage (`runbooks/index.yml`, deploys recentes) | 2 | Entra na semana 3–4, não no go-live |
| War-room Slack bidirecional (canal por Sev1/Sev2) | 2 | Idem — gap nº 1 do benchmark (doc 09) |
| 2–3 runbooks as code **em modo assistido** (label manual + environment gate) | 3 parcial | Promover a automático só depois do piloto |
| QBR mensal (pack de métricas por cliente) | — | Manual (planilha) na v0; insumo direto de T6 |
| Status page Upptime | — | Opcional; repo público (doc 12) |
| Diagnóstico RootPilot | 2/4 | **Se e quando** o runner estiver disponível; flag off → on durante o piloto, medindo T3 antes/depois |

**Fora (registrar pedidos em backlog, não expandir):**

- Auto-remediação sem gate humano (nível 3 pleno)
- Backend fase 3 / wallboard / GitHub App (métricas saem de planilha + billing)
- Integração PSA/ITSM, sync Jira
- SLA contratual com multa (ver §5)
- Múltiplos provedores de paging (GoAlert only; PD/Opsgenie ficam para cliente que já os tem)

## 4. Contrato do piloto — cláusulas críticas

1. **Preço** **[DECISÃO]**: recomendação — **tier M com 50% de desconto por 90
   dias** (R$ 2.495/mês), não gratuito. Cobrar algo é parte do experimento
   (T6): piloto grátis valida cortesia, não disposição a pagar. O desconto é
   trocado explicitamente por: dados de instrumentação, QBRs respondidos e
   direito de case study/logo.
2. **Cláusula de aprendizado cross-tenant — inegociável.** Texto-base: *"dados
   brutos, credenciais e conteúdo de incidentes do cliente nunca saem do seu
   ambiente ou do seu repositório dedicado; a Sunny utiliza aprendizados
   técnicos agregados e anonimizados (padrões de falha, eficácia de runbooks,
   tempos de resolução) para melhorar o serviço para todos os clientes."* Sem
   isso, o flywheel (ADR-0008) e o diferencial nº 4 nascem mortos — e é o
   posicionamento oposto ao "zero training" da Rootly, então precisa estar
   escrito, consentido e defensável.
3. **DPA/LGPD**: Sunny como operadora; subprocessadores nomeados (GitHub,
   Twilio, Cloudflare, provedor de LLM do RootPilot); procedimento para
   incidente de segurança **da própria plataforma**; prazo de notificação.
4. **SLA indicativo, sem multa**: metas de MTTA/MTTR publicadas como alvo
   ("first response < 15 min em Sev1"), medidas e reportadas no QBR — mas o
   piloto é best-effort com sobreaviso, não assento dedicado (doc 12 §5).
5. **Renovação pré-ancorada**: o contrato já nomeia o preço de tabela pós-90
   dias (R$ 4.990) e a cláusula de **reajuste cambial** para o anual (doc 12
   §10 — parte do COGS é dolarizada).
6. **Saída limpa**: as issues são do cliente; offboarding = export/transfer do
   repo conforme doc 05. Reduz o risco percebido de lock-in na assinatura.

## 5. Pré-requisitos de go-live (checklist)

Em ordem; nada de operar cliente antes de 1–8 completos.

1. ☐ **Publicar o repo no GitHub** (`sunnysystems/nocpilot`) e marcá-lo como
   template — pendência registrada desde a criação do kit.
2. ☐ **Subir o GoAlert da Sunny**: 2 VMs + Postgres gerenciado + Twilio;
   service/integration key + escala de sobreaviso do cliente; **teste
   end-to-end de madrugada simulada** (alerta → SMS → voz → escalonamento).
3. ☐ Criar `incidents-<cliente>` a partir do template; rodar
   `setup-labels.sh`; adicionar ao Project consolidado; configurar secrets
   (`PAGING_PROVIDER=goalert`, `PAGING_KEY`, Slack).
4. ☐ **Instrumentar minutos humanos por incidente** — a pendência nº 1 do doc
   12 §9. Decisão recomendada: parâmetro no `/resolve` (ex.: `/resolve 45m
   causa...`), com fallback derivado de assign→close. Sem isso, T3 e T5 ficam
   cegas.
5. ☐ Conectar o monitoramento do cliente ao `incident-ingest.yml` (Datadog
   webhook direto; Alertmanager via relay de ~20 linhas) **e** o paging direto
   monitoramento → GoAlert (independência do GitHub).
6. ☐ Levantamento de stack do cliente (método Pareto do doc 11 §Pareto) →
   provisionar **credenciais read-only** dos 5–6 conectores fase A (AWS role
   read-only, Datadog/Grafana token, Cloudflare token, GitHub PAT
   `/readonly`) — mesmo antes do runner, o levantamento vira a coluna do
   onboarding (doc 05).
7. ☐ Slack: webhook de notificação (dia 1) + bot token com `channels:manage`
   para o war-room (semana 3–4).
8. ☐ **Runbook de modo degradado** escrito e ensaiado: GitHub fora (paging
   continua; registro em retardo), runner morto (triage manual nível 2),
   GoAlert fora (failover/quem liga para quem). É também asset de venda
   (frente 7 da lista estratégica).
9. ☐ Template de QBR v0 (planilha): MTTA/MTTR, ruído, incidentes por
   severidade, ações corretivas fechadas, custo real vs. modelo.
10. ☐ *(condicional)* RootPilot: bearer da org no ingress, write tool de
    comentário em issue, flag de investigação ligada para o tenant (doc 08).

## 6. Operação durante o piloto

- **Sobreaviso**: rotação definida antes do go-live (quem, adicional,
  passagem de plantão) — GoAlert é a fonte de verdade da escala.
- **Ritual semanal (interno)**: revisão de todas as issues da semana —
  disciplina de registro (T1), labels de conector faltante (T4), postmortem de
  todo Sev1/Sev2 via `/postmortem`.
- **Ritual mensal (com o cliente)**: QBR — métricas + o que foi automatizado
  + próximos runbooks candidatos. O QBR é simultaneamente entrega de valor e
  coleta de T6.
- **Recalcular o doc 12** no fim de cada mês com os dados reais (30 min de
  planilha; não deixar para o dia 90).
- **Backlog disciplinado**: pedido fora de escopo → issue no repo do produto,
  nunca "só dessa vez" no piloto.

## 7. Cronograma

| Fase | Quando | O quê |
|---|---|---|
| Preparação | Semana −2 a 0 | Checklist §5 itens 1–9; contrato assinado |
| **Shadow mode** | Semana 1–2 | Alertas fluem, issues abrem, dedup roda — **sem paging ao cliente**; Sunny valida ruído, ajusta severidades e fingerprints |
| Operação plena | Semana 3–12 | Paging ativo; war-room + enriquecimento entram na semana 3–4; runbooks assistidos a partir da semana 5 |
| Checkpoint | Dia 45 | Leitura parcial de T1–T5; corrigir instrumentação se necessário |
| *(se runner chegar)* | Quando disponível | Ligar RootPilot; medir T3 com 2+ semanas de "antes" como baseline |
| **Go/no-go** | Dia 90 | §8 + proposta de renovação a preço de tabela |

O shadow mode é barato (duas semanas) e evita a pior estreia possível: acordar
o cliente às 3h por um alerta que o dedup deveria ter absorvido.

## 8. Go/no-go no dia 90

**GO — abrir o segundo piloto e formalizar pricing** se: T1, T2 e T5 validadas;
COGS real dentro de ±30% do doc 12; cliente renova a preço de tabela (ou
negocia a partir dele, não do desconto); zero incidente de segurança da
plataforma.

**PIVÔ — ajustar antes de escalar** se: minutos humanos muito acima da
premissa (→ repricing pelos dados, doc 12 §7 mostra que é a variável que dói);
T4 abaixo de 80% (→ rever catálogo fase A antes do cliente 2); cliente valoriza
a operação mas não o diagnóstico (→ reordenar roadmap RootPilot vs. runbooks).

**NO-GO — repensar o produto** apenas se: a disciplina de registro não se
sustenta na prática (T1 << alvo) — o produto inteiro pressupõe IssueOps; se
nem operando nós mesmos a timeline fica íntegra, o modelo GitHub-como-cérebro
precisa ser revisto antes de vender de novo.

## 9. Riscos do piloto

| Risco | Mitigação |
|---|---|
| Outage do GitHub durante um Sev1 | Paging direto monitoramento → GoAlert (nunca passa pelo GitHub); runbook degradado ensaiado (§5.8) |
| Runner RootPilot não fica pronto no ciclo | Piloto roda níveis 0–2 por inteiro; T3/T7 migram para o ciclo 2 — **não** atrasar o go-live esperando |
| Cliente único enviesa premissas | Segundo piloto com perfil distinto antes de generalizar pricing (§2) |
| Scope creep | §3 fechado + backlog disciplinado (§6); repactuar só no dia 90 |
| Tempestade de alertas mal-fingerprintada na estreia | Shadow mode de 2 semanas absorve o ajuste |
| Sunny vira gargalo (manutenção + operação nas mesmas pessoas) | Limitar a 1 cliente até o dia 45; o checkpoint decide se cabe o segundo |

## 10. Depois do piloto (para não perder o fio)

1. Dados de 90 dias → revisar doc 12 e travar pricing de tabela.
2. Segundo piloto (perfil distinto) + primeira venda a preço cheio.
3. Fase 3 (GitHub App + backend): mata o cron de SLA, externaliza seats,
   liga o wallboard — as três otimizações que o doc 12 quantificou.
4. Frentes estratégicas engavetadas reabrem com dados: compliance
   BACEN/LGPD/DORA (com um cliente regulado real), benchmark PSA (se pedidos
   de integração aparecerem no backlog), campanha de migração Opsgenie
   (EOL abril/2027).

## Decisões pendentes da Sunny

1. **Qual cliente** (critérios no §2).
2. **Cobrar com desconto vs. grátis** (§4.1 — recomendação: cobrar).
3. **Formato da instrumentação de minutos humanos** (§5.4 — recomendação:
   parâmetro no `/resolve`).
4. Rotação de sobreaviso (quem está na escala do GoAlert).

Complementa: [05 — Onboarding](05-onboarding-cliente.md) ·
[07 — NOC automatizado](07-noc-automatizado.md) ·
[08 — RootPilot](08-integracao-rootpilot.md) ·
[11 — Conectores MCP-first](11-estrategia-conectores-mcp.md) ·
[12 — Unit economics](12-unit-economics.md)
