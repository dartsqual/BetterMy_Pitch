# Unit economics do NocPilot

Modelo de custo por incidente e por cliente/mês do stack Sunny (kit GitHub +
GoAlert + RootPilot + Upptime), com proposta de pricing e análise de margem.
Responde à pergunta que o [benchmark Rootly](09-benchmark-rootly.md) deixou em
aberto: *"margem melhor em escala de MSP"* — quanto, exatamente, e o que move
essa margem.

> Modelo de **11/07/2026**. Todos os valores monetários são **premissas
> parametrizadas** (tabela §2) — o piloto existe para substituí-las por dados
> medidos (§9). Câmbio usado: **R$ 5,50/US$** (placeholder; revisar a cada uso).

## 1. A conclusão antes do modelo

1. **~85% do COGS em escala é gente, não plataforma.** O custo de software
   (GitHub + GoAlert/Twilio + investigations) fica entre US$ 30–75/cliente/mês
   em qualquer cenário. O custo humano vai de R$ 250 a R$ 2.800+/cliente/mês.
   O pricing deve ser ancorado no valor da substituição de trabalho, não no
   custo da plataforma.
2. **A escada de automação do doc 07 é literalmente o roadmap de margem.**
   Cada incidente que migra de "humano" (R$ 53–80 em minutos de analista) para
   "runbook as code" (US$ 0,06 de Actions) converte o maior COGS em centavos.
   Nível 3 não é feature de produto — é expansão de margem bruta.
3. **O runner na infra do cliente externaliza COGS.** O compute do diagnóstico
   (runner) e o egress rodam na infra do cliente; a Sunny paga só o LLM e o
   control plane. A resolve.ai hospeda tudo no cloud dela. É uma vantagem
   estrutural de margem, além da vantagem de confiança do doc 11.
4. **O maior custo de plataforma do kit hoje é um cron.** O `incident-sla.yml`
   a cada 30 min custa ~US$ 11,70/repo/mês — mais que todas as investigations
   de um cliente S. Mover a régua de SLA para o backend da fase 3 (Workers,
   ~grátis) é a otimização de COGS mais barata que existe.
5. **A tensão "custo variável × preço fixo" se resolve com franquia.** O dedup
   por fingerprint e o filtro Sev1/Sev2 do RootPilot criam um teto natural de
   investigations por cliente. Isso permite vender tier mensal fixo (o que o
   comprador MSP espera) com franquia de investigations + excedente.

## 2. Premissas (parâmetros do modelo)

### Custos unitários de plataforma

| Parâmetro | Valor | Fonte/nota |
|---|---|---|
| GitHub Actions (repo privado, Linux) | US$ 0,008/min, **arredondado p/ cima por job** | Tabela pública GitHub — confirmar plano da org |
| Minutos inclusos (GitHub Team) | 3.000/mês na org toda | Idem — 2 repos de cliente já consomem via cron |
| Seat GitHub Team | US$ 4/user/mês | Outside collaborator em repo privado **consome seat** — confirmar |
| Usuários do cliente com acesso ao repo | 4 (parâmetro `U`) | Definir no onboarding |
| Twilio SMS → Brasil | US$ 0,0599/msg (+ taxas de carrier) | [twilio.com/sms/pricing/br](https://www.twilio.com/en-us/sms/pricing/br) |
| Twilio voz → móvel BR | US$ 0,0663/min | [twilio.com/voice/pricing/br](https://www.twilio.com/en-us/voice/pricing/br) |
| Infra GoAlert (2 VMs + Postgres gerenciado) | US$ 70/mês **total Sunny** | Estimativa; rateado entre clientes |
| Backend fase 3 (Workers/VPS) | US$ 25/mês total | Workers free tier provavelmente cobre |
| Investigation RootPilot — F2 (plano fixo) | US$ 0,15 | ~40k tokens in / 4k out em Sonnet-tier, c/ cache |
| Investigation RootPilot — F3 (loop) | **US$ 0,80** (teto ~1,50) | Teto de tool-calls/tokens do ADR-0028; composites reduzem ~98% o token cost (doc 11) |
| Runner do RootPilot (compute + egress) | **US$ 0 para a Sunny** | Roda na infra do cliente (ADR-0001) |
| Upptime (status page) | US$ 0 | Repo público → Actions grátis; **manter público** |

### Custos de gente

| Parâmetro | Valor | Nota |
|---|---|---|
| Hora de analista NOC (custo empresa) | **R$ 80/h** | CLT N1/N2 BR c/ encargos; parametrizar |
| Hora de engenheiro Sunny (manutenção) | R$ 150/h | |
| Manutenção do stack | 15 h/mês | Kit + GoAlert + catálogo de conectores |

### Minutos humanos por incidente (o parâmetro que domina tudo)

| Caminho | Com diagnóstico RootPilot | Sem | Nota |
|---|---|---|---|
| Sev1 | 60 min | 100 min | Diagnóstico em ~2 min comprime o MTTA (doc 08) |
| Sev2 | 40 min | 70 min | |
| Sev3/4 | 15 min | 15 min | Sem investigation (filtro de severidade) |
| Auto-remediado (nível 3) | 2 min | — | Auditoria amostral da timeline |
| Ruído deduplicado | 0 min | 0 min | Fingerprint vira comentário, não issue |

## 3. Custo de plataforma por incidente, por caminho

Fórmula: `Actions (min × 0,008) + Twilio (paging) + Investigation`.

| Caminho | Actions | Twilio | Investigation | **Total plataforma** | + Humano |
|---|---|---|---|---|---|
| Ruído deduplicado | 1 min → 0,01 | — | — | **US$ 0,01** | R$ 0 |
| Sev3/4 | 4 min → 0,03 | — | — | **US$ 0,03** | R$ 20 |
| Sev2 | 5 min → 0,04 | 2 SMS → 0,12 | F3 0,80 | **US$ 0,96** | R$ 53 |
| Sev1 | 6 min → 0,05 | 4 SMS + 2 min voz → 0,37 | F3 0,80 | **US$ 1,22** | R$ 80 |
| Auto-remediado | 8 min (runbook + health check) → 0,06 | — | — | **US$ 0,06** | R$ 3 |

Duas leituras:

- **Uma tempestade de 200 alertas deduplicados custa US$ 2.** O dedup por
  fingerprint não é só higiene operacional — é a feature que torna o modelo de
  franquia seguro (ruído não consome investigations nem gente).
- **A diferença Sev1 "com humano" vs "auto-remediado" é R$ 80 → R$ 3,3**
  (US$ 0,06 + 2 min de auditoria). É o item 2 da conclusão: cada runbook
  promovido a automático move incidentes da coluna cara para a coluna de
  centavos.

## 4. Custo mensal por cliente — cenários

Custo fixo por cliente: seats (4 × US$ 4 = 16) + cron SLA (1.460 min × 0,008 =
11,7) = **US$ 27,7/mês**. Rateio da base Sunny (GoAlert 70 + backend 25 =
US$ 95, dividido por N=10 clientes): **US$ 9,5/mês**.

| | **S** (10 alertas/mês) | **M** (60 alertas/mês) | **L** (300 alertas/mês) |
|---|---|---|---|
| Mix | 4 ruído · 3 Sev3/4 · 2 Sev2 · 1 Sev1 · 0 auto | 35 ruído · 12 Sev3/4 · 7 Sev2 · 3 Sev1 · 3 auto | 210 ruído · 40 Sev3/4 · 25 Sev2 · 8 Sev1 · 17 auto |
| Plataforma fixa + rateio | 37,2 | 37,2 | 37,2 |
| Plataforma variável | 3,3 | 11,3 | 38,1 |
| **Plataforma total (US$)** | **40,5** | **48,5** | **75,3** |
| Plataforma total (R$ @5,50) | 223 | 267 | 414 |
| Horas humanas | 3,1 h | 10,8 h | 35,2 h |
| **Humano (R$ 80/h)** | **247** | **862** | **2.818** |
| **COGS total (R$/mês)** | **≈ 470** | **≈ 1.130** | **≈ 3.230** |
| Plataforma como % do COGS | 47% | 24% | 13% |

Observações:

- **No tier S, quase metade do COGS é plataforma fixa** (seats + cron). Matar o
  cron na fase 3 e usar o modelo GitHub App (installation na org do cliente →
  seats do lado do cliente) derruba o COGS do tier S em ~40%. Os dois itens já
  estão no roadmap por outros motivos — este modelo dá o motivo financeiro.
- **Em L, plataforma é ruído (13%)** — o jogo inteiro é reduzir horas humanas,
  e o mix auto-remediado é a alavanca (ver §7).
- Investigations — o custo que parecia assustador — somam US$ 2,40 (S) a
  US$ 26 (L)/mês. A quota da Datadog e o teto do F3 mantêm isso linear.

## 5. O degrau que o modelo precisa marcar: cobertura 24/7

Os cenários acima custeiam **incidente a incidente** (modelo sobreaviso:
on-call de engenheiros com adicional, viável para MSP pequeno). Um NOC com
**assento 24/7 dedicado** é outra função de custo: 168 h/semana ÷ 40 h ≈ 4,2
FTEs por assento ≈ **R$ 42–55k/mês** — um custo-degrau que não escala com
incidentes.

Regra de decisão: o assento dedicado só entra quando o MRR do NOC passar de
~R$ 60–70k **ou** um contrato enterprise pagar por ele explicitamente (linha
"cobertura dedicada" no contrato). Até lá: sobreaviso + paging direto do
GoAlert + diagnóstico automático segurando o MTTA. **Não assinar SLA que
pressuponha assento dedicado antes desse MRR.**

## 6. Receita: âncoras de mercado e pricing proposto

### Âncoras (jul/2026)

| Referência | Preço | Para um cliente com 5 responders |
|---|---|---|
| [Rootly](https://rootly.com/pricing) | US$ 20/user/mês (Essentials) | US$ 100/mês |
| [PagerDuty](https://www.pagerduty.com/pricing/incident-management/) | US$ 21–41/user/mês | US$ 105–205/mês |
| [incident.io](https://incident.io/pricing) | US$ 19–25/user + US$ 10–12 on-call | US$ 145–185/mês |
| Stack tooling equivalente (Rootly/incident.io + on-call) | — | **≈ US$ 180/mês ≈ R$ 1.000** |
| Fazer em casa (eng. do cliente respondendo incidentes) | 10–35 h/mês × R$ 150+/h | **R$ 1.500–5.000+/mês** |

O NocPilot vende as duas linhas juntas (ferramenta **e** operação) — o preço
ancora na soma, não no tooling.

### Proposta: 3 tiers fixos + franquia de investigations

| Tier | Preço/mês | Franquia investigations | COGS (§4) | **Margem bruta** |
|---|---|---|---|---|
| **S** | R$ 1.990 | 5 | R$ 470 | **76%** |
| **M** | R$ 4.990 | 15 | R$ 1.130 | **77%** |
| **L** | R$ 12.900 | 40 | R$ 3.230 | **75%** |
| Excedente | R$ 19/investigation | — | ~R$ 4,40 | 77% |
| Add-ons | Cobertura 24/7 dedicada (custo §5 + margem) · runbook novo as code (projeto) | | | |

Racional do desenho:

- **Fixo mensal** é o que o comprador MSP/cliente espera (previsibilidade
  ganha de per-seat — e per-seat penalizaria exatamente o cliente que adota
  bem, convidando o time todo).
- **Franquia** converte o único custo variável relevante em previsível para os
  dois lados; o dedup + filtro Sev1/Sev2 tornam estouros raros por construção.
- **Excedente a ~4× o COGS** protege a cauda sem virar centro de lucro — meta
  é o cliente subir de tier, não pagar excedente.
- O tier S a R$ 1.990 fica **abaixo do custo de fazer em casa** (tooling
  R$ 1.000 + horas próprias) — argumento de venda aritmético.

## 7. Sensibilidade: o que move a agulha (e o que não move)

Testado sobre o cenário M (COGS R$ 1.130, preço R$ 4.990, margem 77%):

| Variação | Novo COGS | Margem | Leitura |
|---|---|---|---|
| Minutos humanos +50% (time júnior, incidentes feios) | R$ 1.560 | 69% | **A variável dominante.** Erro aqui dói |
| Auto-remediação 3 → 10 incidentes/mês | R$ 900 | 82% | **+5 p.p. de margem por ~7 runbooks efetivos** |
| Investigation F3 US$ 0,80 → 2,40 (loop pesado) | R$ 1.190 | 76% | Quase nada — o teto do ADR-0028 já limita |
| Twilio 3× (escalonamentos longos) | R$ 1.140 | 77% | Ruído |
| Cron SLA movido p/ fase 3 (US$ 11,7 → 0) | R$ 1.070 | 79% | Pequeno em M, grande em S (§4) |
| Câmbio R$ 5,50 → 6,50 | R$ 1.180 | 76% | ~18% do COGS é dolarizado; cláusula de reajuste resolve |

Conclusão da sensibilidade: **duas variáveis reais — minutos humanos por
incidente e taxa de auto-remediação.** Todo o resto é segunda ordem. As duas
são exatamente o que os níveis 2–4 do doc 07 atacam, nesta ordem: diagnóstico
automático corta minutos por incidente (−40% em Sev1/Sev2, premissa §2);
runbooks as code zeram incidentes inteiros.

## 8. Custos fixos da Sunny e break-even

| Item | R$/mês |
|---|---|
| GoAlert + backend (US$ 95) | 523 |
| Manutenção (15 h × R$ 150) | 2.250 |
| **Base fixa** | **≈ 2.770** |

Margem de contribuição por cliente: S ≈ R$ 1.520 · M ≈ R$ 3.860 · L ≈ R$ 9.670.
**Break-even: 2 clientes S, ou 1 M.** A base fixa é tão baixa (consequência do
stack open-source + serverless) que o negócio é viável desde o primeiro punhado
de clientes — o risco econômico não está no custo, está em subestimar minutos
humanos ou assinar SLA de assento dedicado cedo demais (§5).

## 9. Como o piloto valida o modelo

O insight operacional: **os inputs deste modelo são as métricas que o wallboard
da fase 3 já vai medir** (doc 07). O piloto só precisa de disciplina de registro:

| Parâmetro do modelo | Instrumento de medição |
|---|---|
| Alertas/mês e mix de severidade | Labels `sevN` + contagem de issues (já nativo) |
| Taxa de ruído (dedup) | Comentários de fingerprint ÷ alertas recebidos (`incident-ingest.yml`) |
| Minutos humanos por incidente | **Falta instrumentar**: registrar tempo gasto no `/resolve` (campo novo) ou derivar de timestamps assign→resolve com desconto; decidir antes do go-live |
| Custo real de investigation | Métrica de tokens/custo por `session_trace` do RootPilot (pedir no PRD-022) |
| Minutos de Actions | Relatório de billing da org GitHub (mensal) |
| Twilio por incidente | Console Twilio, tag por service do GoAlert |

Critério de revisão: rodar 90 dias, recalcular §4 com dados reais, e revisar
preços **antes** de assinar o segundo contrato anual.

## 10. Registro das descobertas estruturais

1. **Runner na infra do cliente = COGS externalizado** — vantagem de margem
   estrutural sobre AI SREs SaaS, somada à vantagem de confiança (doc 11).
2. **Cron SLA é o maior custo de plataforma do kit** e morre na fase 3 —
   priorizar.
3. **Modelo GitHub App (fase 3) externaliza seats** no caminho enterprise.
4. **Dedup e filtro de severidade são as features que viabilizam franquia** —
   sem elas, pricing fixo seria aposta.
5. **Upptime deve ficar em repo público** (Actions grátis); status page privada
   inverteria a conta.
6. **O flywheel do RootPilot também é econômico**: cada investigation melhora
   as próximas (ADR-0008) → minutos humanos por incidente caem com o tempo →
   a margem do mesmo contrato cresce sem reprecificar.
7. **FX**: ~15–50% do COGS é dolarizado (mais no tier S); prever cláusula de
   reajuste cambial nos contratos anuais.

## Fontes

[Twilio SMS Brasil](https://www.twilio.com/en-us/sms/pricing/br) ·
[Twilio Voice Brasil](https://www.twilio.com/en-us/voice/pricing/br) ·
[Rootly pricing](https://rootly.com/pricing) ·
[incident.io pricing](https://incident.io/pricing) ·
[PagerDuty pricing](https://www.pagerduty.com/pricing/incident-management/) ·
preços de GitHub (Actions/Team) citados de tabela pública — **confirmar no
billing da org antes de fechar preços**. Complementa:
[07 — NOC automatizado](07-noc-automatizado.md) ·
[08 — RootPilot](08-integracao-rootpilot.md) ·
[09 — Benchmark Rootly](09-benchmark-rootly.md) ·
[11 — Conectores MCP-first](11-estrategia-conectores-mcp.md)
