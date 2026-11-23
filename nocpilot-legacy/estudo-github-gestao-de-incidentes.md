# Estudo: GitHub como sistema de gestão de incidentes multi-cliente (Sunny Systems)

**Data:** 11/07/2026 · **Autor:** estudo técnico de viabilidade

---

## 1. Resumo executivo

**É viável, e existe até nome para o padrão: "IssueOps"** — usar Issues, Projects e Actions como interface de automação de processos, promovido pelo próprio GitHub. Com os lançamentos de 2025 (issue types, sub-issues, issue fields tipados, limite de 50 mil itens por projeto), o GitHub Issues + Projects v2 cobre bem o ciclo de vida de um incidente: abertura estruturada, classificação por severidade, acompanhamento em board, timeline auditável, postmortem e métricas.

**Webhooks: sim, suporta** — com uma ressalva importante: eventos de **Issues** existem em webhooks de repositório, organização e GitHub App, mas eventos de **Projects v2** (`projects_v2`, `projects_v2_item`, `projects_v2_status_update`) **só existem em webhooks de organização e GitHub Apps** — não em webhooks de repositório.

**Para multi-cliente**, a arquitetura recomendada é uma **GitHub App da Sunny Systems** instalada nas organizações/repositórios de cada cliente, com um endpoint central de webhooks que alimenta um backend consolidado (dashboard, SLA, métricas). É exatamente o modelo que ferramentas SaaS usam para integrar com GitHub em escala.

**O que o GitHub NÃO faz nativamente:** on-call/escalonamento/paging (acordar alguém de madrugada), timers de SLA e status page pública. Esses pontos exigem integração (PagerDuty, Grafana OnCall, Slack) ou complementos open-source (Upptime).

---

## 2. Blocos de construção

### 2.1 Issues como registro do incidente

Cada incidente = uma issue. O que o GitHub oferece hoje:

| Recurso | Uso na gestão de incidentes |
|---|---|
| **Issue Types** (org-wide, GA 2025) | Criar o tipo `Incident` no nível da organização — classificação consistente entre todos os repositórios |
| **Issue Fields** (GA) | Campos tipados que **viajam com a issue** entre projetos: `Severidade` (single-select com cores), `Detectado em` (data), `Cliente` (single-select). Tipos: texto, número, data, single-select, iteration |
| **Sub-issues** (GA 2025) | Hierarquia pai-filho: o incidente é o pai; ações de mitigação, comunicação e postmortem são sub-issues com progresso agregado |
| **Labels** | `sev1`…`sev4`, `incident`, serviço afetado, cliente (quando em repo compartilhado) |
| **Timeline nativa** | Todo comentário, mudança de label, atribuição e fechamento fica registrado com timestamp — audit trail de graça, essencial para postmortem |
| **Issue Forms** (templates YAML) | Formulário estruturado de abertura: dropdown de severidade/serviço com `validations: required`, campos de descrição de impacto obrigatórios |

Exemplo de issue form (`.github/ISSUE_TEMPLATE/incident.yml`):

```yaml
name: "🚨 Incidente"
description: Reportar um incidente em produção
title: "[INC] "
labels: ["incident", "triage"]
type: Incident
body:
  - type: dropdown
    id: severity
    attributes:
      label: Severidade
      options:
        - "Sev1 — Indisponibilidade total"
        - "Sev2 — Degradação severa"
        - "Sev3 — Degradação parcial"
        - "Sev4 — Sem impacto em cliente"
    validations:
      required: true
  - type: dropdown
    id: service
    attributes:
      label: Serviço afetado
      options: ["API", "Portal", "Integrações", "Infra"]
    validations:
      required: true
  - type: textarea
    id: impact
    attributes:
      label: Impacto observado
      description: O que está quebrado? Desde quando? Quantos usuários afetados?
    validations:
      required: true
```

> ⚠️ Caveat conhecido: dropdowns em issue forms auto-populam com o primeiro valor mesmo quando `required` — vale colocar a opção mais severa ou um placeholder tipo "— selecione —" como primeira opção e validar via Action.

### 2.2 Projects v2 como painel de acompanhamento

- **Campos customizados** por projeto (até 50 campos): `Status do incidente` (Investigando → Identificado → Monitorando → Resolvido), `SLA due date`, `MTTR`, `Cliente`.
- **Views**: board Kanban por status, tabela ordenada por severidade, visão filtrada por cliente (`field:Cliente = X`), roadmap por data.
- **Automações nativas (built-in workflows)**: *auto-add* (issue com label `incident` em determinado repo entra automaticamente no projeto), *item closed → status Done*, *auto-archive* de resolvidos antigos.
- **Insights**: gráficos nativos (incidentes abertos por severidade, burn-down, throughput).
- **Limites atuais**: 50.000 itens por projeto (era 1.200 até 2025), 50 campos por projeto.
- **API**: Projects v2 é exposto **somente via GraphQL** (não REST) — relevante para automações que escrevem no projeto.

### 2.3 Automação com GitHub Actions (IssueOps)

Actions dispara em eventos de issue e comentário, o que permite montar a máquina de estados do incidente dentro do próprio GitHub:

- `issues: opened` com label `sev1` → cria canal no Slack, notifica on-call, adiciona ao projeto, marca timestamp de detecção.
- `issue_comment` com comandos: `/resolve`, `/mitigated`, `/postmortem` → muda status, cria sub-issue de postmortem a partir de template.
- `schedule` (cron) → varre incidentes abertos e cobra atualização de status quando o SLA de comunicação estoura.
- Fechamento da issue → calcula MTTR (fechamento − abertura) e grava no campo do projeto via GraphQL.

O GitHub documenta esse padrão como [IssueOps](https://github.blog/engineering/issueops-automate-ci-cd-and-more-with-github-issues-and-actions/) e mantém a organização [issue-ops](https://github.com/issue-ops) com actions prontas (parser de issue forms, validação, state machine).

### 2.4 Complemento pronto: Upptime (monitoramento + status page)

O [Upptime](https://github.com/upptime/upptime) é open-source e roda 100% sobre GitHub Actions + Issues + Pages: monitora endpoints a cada 5 minutos, **abre uma issue automaticamente quando detecta downtime**, fecha quando volta, e publica uma status page via GitHub Pages. Um repositório Upptime por cliente = status page e detecção automática de incidentes por cliente, custo zero de infraestrutura. É um excelente "detector" para alimentar o fluxo de incidentes descrito acima.

---

## 3. Webhooks: o que existe e onde

| Evento | Webhook de repositório | Webhook de organização | GitHub App |
|---|---|---|---|
| `issues` (opened, labeled, closed, typed, edited…) | ✅ | ✅ | ✅ |
| `issue_comment` | ✅ | ✅ | ✅ |
| `projects_v2` (projeto criado/fechado/editado) | ❌ | ✅ | ✅ (permissão org "Projects": read) |
| `projects_v2_item` (item criado/editado/movido/arquivado) | ❌ | ✅ | ✅ (idem) |
| `projects_v2_status_update` (status updates do projeto) | ❌ | ✅ | ✅ (idem) |

Pontos importantes:

1. **Mudanças de campos vêm no payload**: desde 2024, o evento `projects_v2_item.edited` inclui valor anterior e atual do campo alterado — dá para rastrear "Investigando → Resolvido" sem query GraphQL adicional.
2. **Eventos de Projects v2 ainda são "public preview"** e sujeitos a mudança, segundo a documentação.
3. **GitHub não reenvia webhooks automaticamente em caso de falha** do seu endpoint. Responda `2xx` rápido (< 10s), processe assíncrono (fila), e use a API de redelivery para recuperar entregas perdidas (ficam disponíveis por alguns dias).
4. **Segurança**: valide a assinatura HMAC (`X-Hub-Signature-256`) com o webhook secret.
5. **Limites**: 20 webhooks por evento por repo/org — irrelevante no modelo GitHub App (1 endpoint para todas as instalações).

---

## 4. Arquitetura multi-cliente para a Sunny Systems

Três modelos possíveis:

### Opção A — Uma organização Sunny, um repositório privado de incidentes por cliente

```
org: sunnysystems
├── incidents-cliente-a   (privado, cliente A como outside collaborator)
├── incidents-cliente-b   (privado, cliente B como outside collaborator)
└── Project org-level "Incident Response" (auto-add de todos os repos incidents-*)
```

- ✅ Mais simples de operar: 1 webhook de organização cobre issues **e** projects de todos os clientes; um único board consolidado com views filtradas por cliente.
- ✅ Isolamento por repositório: cliente A não vê o repo do cliente B.
- ⚠️ Cuidado com o Project org-level: quem tem acesso ao projeto vê os itens dos repos aos quais tem acesso — clientes **não** devem ter acesso ao projeto consolidado (uso interno Sunny). Para dar visão ao cliente, criar um projeto por cliente ou usar a própria lista de issues do repo dele.
- ⚠️ Governança: todos os clientes "moram" na organização da Sunny.

### Opção B — Uma organização por cliente + GitHub App da Sunny

```
GitHub App "Sunny Incident Manager"
├── instalada na org cliente-a  → webhooks → ┐
├── instalada na org cliente-b  → webhooks → ├──> endpoint central Sunny → fila → backend
└── instalada na org sunny      → webhooks → ┘         (dashboard multi-cliente, SLA, métricas)
```

- ✅ Isolamento total entre clientes (modelo SaaS correto); ideal para clientes enterprise que **já têm** organização GitHub própria — a app é instalada na org deles e os incidentes vivem no GitHub do cliente.
- ✅ A app recebe webhooks de **todas** as instalações num único endpoint; o payload identifica `installation.id` e a org → mapeamento installation → cliente no backend.
- ✅ Autenticação como app (token por instalação, ~5.000 req/h **por instalação** — escala linearmente com o número de clientes; sem PAT de funcionário como ponto único de falha).
- ⚠️ Mais administração (uma org por cliente, billing separado) quando a Sunny é quem cria as orgs.

### Opção C (recomendada) — Híbrido com GitHub App desde o dia 1

Mesmo começando no modelo A (repos na org da Sunny), **implemente a integração como GitHub App**, não como webhooks de organização avulsos:

1. Clientes pequenos: repo `incidents-<cliente>` na org da Sunny; app instalada na org da Sunny.
2. Clientes enterprise: app instalada na org do cliente.
3. O backend não muda nada entre os dois casos — só muda onde a app está instalada.

É o caminho que não exige re-arquitetura quando o primeiro cliente grande pedir para manter os dados na organização dele.

### Desenho da solução recomendada

1. **Padronização (por org atendida)**: issue type `Incident`; issue fields `Severidade` e `Serviço`; labels padrão; issue form de abertura; template de postmortem.
2. **Project "Incident Response"** org-level com workflow auto-add (`label:incident`), campos `Status do incidente`, `SLA due`, `Cliente`; views por severidade/cliente/status.
3. **Actions (IssueOps)**: triage automático na abertura, comandos por comentário, cron de cobrança de SLA, cálculo de MTTR no fechamento.
4. **GitHub App "Sunny Incident Manager"**: subscreve `issues`, `issue_comment`, `projects_v2_item`, `projects_v2_status_update`; endpoint central → fila → banco; dashboard consolidado multi-cliente com MTTA/MTTR, incidentes abertos por severidade e SLA por contrato.
5. **Opcional**: Upptime por cliente como detector automático + status page pública.
6. **Integração de paging**: Action em `sev1/sev2 opened` dispara PagerDuty/Grafana OnCall/Slack.

---

## 5. Limitações e riscos

| Limitação | Mitigação |
|---|---|
| Sem on-call, escalonamento ou paging nativo | Integrar PagerDuty / Grafana OnCall / Opsgenie* via Actions ou webhook. (*Opsgenie foi descontinuado pela Atlassian — fim de suporte em 2027; evitar para novos projetos) |
| Sem timer/SLA nativo | Cron via Actions + campo `SLA due` no projeto; enforcement real no backend da Sunny |
| Webhooks de Projects v2 em public preview e só org/app-level | Tratar o backend como tolerante a mudança de payload; issues como fonte primária de verdade |
| GitHub não faz retry automático de webhook | Fila + redelivery API; reconciliação periódica via GraphQL |
| **Se o GitHub cair, o sistema de incidentes cai junto** (e o GitHub teve outages relevantes em 2025) | Runbook de contingência fora do GitHub (doc + canal Slack) para incidentes "o GitHub está fora" |
| API de Projects v2 é só GraphQL | Usar octokit/graphql; issues têm REST normal |
| Visibilidade cruzada em projects org-level | Projeto consolidado é interno; visão do cliente = repo dele ou projeto dedicado |
| Actions em repos privados consomem minutos do plano | Free: 2.000 min/mês; Team (~US$4/usuário/mês) sobe o limite; automações de incidente são leves |

---

## 6. GitHub vs. ferramenta dedicada — quando cada um faz sentido

**GitHub basta quando:** o time que resolve incidentes já vive no GitHub; o volume é baixo/médio; o valor está em rastreabilidade, postmortem ligado a código/PRs e custo próximo de zero; os clientes aceitam (ou preferem) acompanhar via GitHub.

**Ferramenta dedicada (incident.io, FireHydrant, PagerDuty) quando:** precisa de on-call com escalonamento e telefonia, SLA contratual com enforcement automático, status page gerenciada com assinatura de clientes, ou relatórios executivos prontos. Nada impede o híbrido: paging na ferramenta dedicada, registro e postmortem no GitHub.

Há ainda o meio-termo open-source: [incidentbot](https://github.com/incidentbot/incidentbot) (framework de gestão de incidentes via Slack) combinável com Issues.

---

## 7. Roadmap sugerido de implementação

| Fase | Entrega | Esforço |
|---|---|---|
| 1 | Piloto em 1 repo: issue type + issue form + labels + project com auto-add | ~1 dia |
| 2 | Actions de triage, comandos por comentário e cron de SLA | 2–3 dias |
| 3 | GitHub App + endpoint de webhooks + fila + banco (registro consolidado) | ~1 semana |
| 4 | Dashboard multi-cliente (MTTA/MTTR, SLA) + onboarding de clientes (script de provisionamento de repo/labels/form) | 1–2 semanas |
| 5 | Opcional: Upptime por cliente + integração de paging | 2–3 dias |

---

## Fontes

- [IssueOps: Automate CI/CD (and more!) with GitHub Issues and Actions — GitHub Blog](https://github.blog/engineering/issueops-automate-ci-cd-and-more-with-github-issues-and-actions/) · [IssueOps Docs](https://issue-ops.github.io/docs/)
- [Webhook events and payloads — GitHub Docs](https://docs.github.com/en/webhooks/webhook-events-and-payloads) · [Types of webhooks](https://docs.github.com/en/webhooks/types-of-webhooks) · [Creating webhooks](https://docs.github.com/en/webhooks/using-webhooks/creating-webhooks)
- [GraphQL and webhook support for project status updates — GitHub Changelog](https://github.blog/changelog/2024-06-27-github-issues-projects-graphql-and-webhook-support-for-project-status-updates-and-more/)
- [Evolving GitHub Issues and Projects (GA): sub-issues, issue types, 50k itens — community discussion](https://github.com/orgs/community/discussions/154148) · [Evolving GitHub Issues (public preview) — Changelog](https://github.blog/changelog/2025-01-12-evolving-github-issues-public-preview/)
- [Managing issue fields in your organization — GitHub Docs](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/managing-issue-fields-in-your-organization) · [Understanding fields (Projects)](https://docs.github.com/en/issues/planning-and-tracking-with-projects/understanding-fields)
- [Syntax for issue forms — GitHub Docs](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms) · [Caveat de dropdown required — community discussion](https://github.com/orgs/community/discussions/150368)
- [Using the built-in automations (Projects) — GitHub Docs](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-built-in-automations)
- [Scaling GitHub App installation tokens across many organizations — community discussion](https://github.com/orgs/community/discussions/196652) · [Scaling GitHub App integration for per-customer deployments — Facets](https://www.facets.cloud/blog/scaling-github-app-integration-for-per-customer-deployments)
- [Upptime — uptime monitor & status page via Actions/Issues/Pages](https://github.com/upptime/upptime) · [Como funciona](https://upptime.js.org/docs/)
- [incidentbot — framework open-source de gestão de incidentes](https://github.com/incidentbot/incidentbot)
