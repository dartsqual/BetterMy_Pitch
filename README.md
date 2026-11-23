# NocPilot ✈️

> *Every NOC needs a pilot.*

**NocPilot** é a plataforma de gestão de incidentes e NOC multi-cliente da Sunny
Systems, construída sobre GitHub Issues + Projects + Actions, com on-call via
GoAlert (ou PagerDuty/Opsgenie do cliente) e diagnóstico automático via
[RootPilot](docs/08-integracao-rootpilot.md). Este repositório é o **template**:
cada cliente ganha um repo `incidents-<cliente>` criado a partir dele.

Contexto e decisões: [estudo de viabilidade](estudo-github-gestao-de-incidentes.md) ·
[decisão de naming](docs/10-naming.md).

## Documentação

| Documento | Para quem |
|---|---|
| [01 — Visão geral](docs/01-visao-geral.md): conceito, modelo de dados, ciclo de vida, diagramas | Todos |
| [02 — Instalação](docs/02-instalacao.md): configuração inicial da org, Project, labels e secrets | Quem vai implantar |
| [03 — Guia de uso](docs/03-guia-de-uso.md): abrir incidente, régua de severidade, comandos, postmortem | Quem opera incidentes |
| [04 — Referência técnica](docs/04-referencia-tecnica.md): cada workflow em detalhe, labels, segurança, customização | Engenharia |
| [05 — Onboarding de cliente](docs/05-onboarding-cliente.md): runbook de ~15 min por cliente novo, offboarding | Quem faz onboarding |
| [06 — Troubleshooting e FAQ](docs/06-troubleshooting.md): automação que não disparou, erros comuns | Todos |
| [07 — NOC automatizado](docs/07-noc-automatizado.md): ingestão de alertas, runbooks as code, escada de maturidade | Engenharia / estratégia |
| [08 — Integração com o RootPilot](docs/08-integracao-rootpilot.md): diagnóstico automático como cérebro dos níveis 2 e 4 do NOC | Engenharia / estratégia |
| [09 — Benchmark Rootly](docs/09-benchmark-rootly.md): paridade e gaps frente ao concorrente comercial mais próximo | Estratégia / produto |
| [10 — Naming](docs/10-naming.md): por que NocPilot, a família `*Pilot` e o dossiê de domínios | Estratégia / produto |
| [11 — Estratégia de conectores MCP-first](docs/11-estrategia-conectores-mcp.md): MCP servers oficiais curados como camada de conectores do RootPilot | Estratégia / engenharia |
| [12 — Unit economics](docs/12-unit-economics.md): custo por incidente e por cliente, pricing em tiers com franquia, sensibilidade e break-even | Estratégia / produto |
| [13 — Desenho do piloto](docs/13-desenho-do-piloto.md): teses a validar, perfil do cliente, contrato, checklist de go-live e go/no-go em 90 dias | Todos |

## O que precisa ser configurado (e onde)

### 1. Só cliques na interface — uma vez por organização

| Configuração | Onde |
|---|---|
| Issue type `Incident` | Org → Settings → Planning → Issue types |
| Issue fields `Severidade` e `Serviço` (single-select) | Org → Settings → Planning → Issue fields *(opcional; as labels deste kit já cobrem o básico)* |
| Project "Incident Response" | Org → Projects → New project |
| Campos do projeto: `Status do incidente`, `SLA due`, `Cliente` | Dentro do projeto → ⚙ Fields |
| Workflow **Auto-add**: `label:incident` nos repos `incidents-*` | Projeto → ⚙ → Workflows |
| Workflow **Item closed → Done** (já vem ativo) | Projeto → ⚙ → Workflows |

### 2. Arquivos deste repositório — copiados para cada repo de cliente

| Arquivo | O que faz |
|---|---|
| `.github/ISSUE_TEMPLATE/incident.yml` | Formulário estruturado de abertura de incidente (severidade e serviço obrigatórios) |
| `.github/ISSUE_TEMPLATE/postmortem.yml` | Formulário de postmortem para abertura manual |
| `.github/ISSUE_TEMPLATE/config.yml` | Desabilita issues em branco |
| `.github/workflows/incident-triage.yml` | Na abertura: aplica label `sevN` lida do formulário e notifica Slack em Sev1/Sev2 |
| `.github/workflows/incident-commands.yml` | Comandos por comentário: `/mitigated`, `/resolve`, `/postmortem` (cria o postmortem como sub-issue) |
| `.github/workflows/incident-sla.yml` | Cron a cada 30 min cobrando atualização de Sev1 (>1h parado) e Sev2 (>4h) |
| `.github/workflows/incident-ingest.yml` | Recebe alertas do monitoramento via `repository_dispatch`, com dedup por fingerprint |
| `.github/workflows/incident-paging.yml` | Encerra o acionamento no on-call quando o incidente é fechado manualmente |
| `.github/actions/page-oncall/` | Adapter de on-call: GoAlert (default), PagerDuty ou Opsgenie — troca por cliente via `PAGING_PROVIDER` |
| `scripts/setup-labels.sh` | Cria as labels padrão via `gh` CLI |

**Onboarding de um cliente novo:**

```bash
# 1. Crie o repo a partir deste template (marque este repo como "Template repository" no GitHub)
gh repo create sunnysystems/incidents-<cliente> --private --template sunnysystems/nocpilot

# 2. Provisione as labels
./scripts/setup-labels.sh sunnysystems/incidents-<cliente>

# 3. Configure o secret do Slack (canal de incidentes do cliente ou o da Sunny)
gh secret set SLACK_WEBHOOK_URL --repo sunnysystems/incidents-<cliente>

# 4. No Project "Incident Response", inclua o repo novo no filtro do Auto-add
```

Configuração por repo: secret `SLACK_WEBHOOK_URL` (incoming webhook do Slack;
sem Slack, remova o passo de notificação), e o acionamento de on-call via
variáveis `PAGING_PROVIDER` (`goalert` | `pagerduty` | `opsgenie` | ausente =
desativado) e `PAGING_ENDPOINT` + secret `PAGING_KEY` — contrato completo na
[referência técnica](docs/04-referencia-tecnica.md#acionamento-de-on-call--action-page-oncall).

### 3. Programação de verdade — só na fase do consolidado multi-cliente

Nada disto é necessário para o piloto funcionar. Entra quando quisermos o dashboard
único da Sunny com MTTA/MTTR e SLA por contrato:

- **GitHub App "Sunny Incident Manager"** assinando `issues`, `issue_comment`,
  `projects_v2_item` e `projects_v2_status_update` (eventos de Projects v2 só
  existem via App ou webhook de organização).
- Endpoint de webhook → fila → banco → dashboard.
- Detalhes de arquitetura no estudo, seção 4.

## Observações

- O `type: Incident` no `incident.yml` exige que o issue type exista na organização;
  remova a linha se ainda não criou o tipo.
- Dropdowns de issue forms têm um caveat conhecido: podem auto-selecionar a primeira
  opção mesmo com `required`. Por isso o triage lê a severidade do corpo e aplica a
  label — corrija a label manualmente se a triagem inicial errar.
- O lembrete de SLA usa `updated_at` da issue, então qualquer comentário (inclusive
  o próprio lembrete) reinicia a janela — é cobrança de comunicação, não enforcement
  contratual. Enforcement real fica no backend (fase 3).
