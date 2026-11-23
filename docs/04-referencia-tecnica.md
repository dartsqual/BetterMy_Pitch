# Referência técnica

Detalhamento de cada componente do kit: gatilhos, permissões, comportamento e
pontos de customização.

## Formulários (issue forms)

### `.github/ISSUE_TEMPLATE/incident.yml`

Formulário de abertura de incidente. Aplica automaticamente:

- **Labels**: `incident` (dispara toda a automação e o Auto-add do Project) e
  `triage` (sinaliza que ainda não foi classificado por um humano).
- **Issue type**: `Incident` — exige o tipo criado na organização; remova a linha
  `type: Incident` se a org não tiver o tipo.
- **Título**: prefixo `[INC] `.

Campos: `severity` (dropdown Sev1–Sev4, obrigatório), `service` (dropdown,
obrigatório), `started-at` (input, obrigatório), `impact` (textarea, obrigatório),
`evidence` (textarea, opcional).

**Customização por cliente**: edite as `options` de `service` no repo do cliente
para refletir os serviços contratados.

**Caveat conhecido**: dropdowns de issue forms podem auto-selecionar a primeira
opção mesmo com `required: true` ([discussão na comunidade](https://github.com/orgs/community/discussions/150368)).
Como `Sev1` é a primeira opção, o erro de preenchimento tende a ser "para cima"
(falso alarme), nunca subnotificação. O triage lê a severidade do corpo — corrija a
label manualmente se necessário.

### `.github/ISSUE_TEMPLATE/postmortem.yml`

Formulário para abrir postmortem manualmente (o caminho normal é o comando
`/postmortem`). Aplica a label `postmortem`. Campos: incidente relacionado, resumo,
linha do tempo, causa raiz e ações corretivas — todos obrigatórios.

### `.github/ISSUE_TEMPLATE/config.yml`

`blank_issues_enabled: false` — força o uso dos formulários na interface web.
Não impede criação de issue via API/CLI.

## Workflows

Todos usam apenas o `GITHUB_TOKEN` nativo com `permissions: issues: write` —
nenhum PAT pessoal, nenhum secret além do Slack.

### `incident-triage.yml`

| | |
|---|---|
| **Gatilho** | `issues: [opened]` |
| **Condição** | issue tem a label `incident` (aplicada pelo formulário) |
| **Permissões** | `issues: write`, `contents: read` |
| **Secrets/vars** | `SLACK_WEBHOOK_URL`; `PAGING_PROVIDER`/`PAGING_ENDPOINT` (vars) e `PAGING_KEY` (ver [acionamento de on-call](#acionamento-de-on-call--action-page-oncall)) |

Passos:

1. **Label de severidade** — extrai a severidade do corpo da issue com a regex
   `/sev\s*([1-4])/i` (o dropdown do formulário grava "Sev1"…"Sev4" no corpo) e
   aplica a label `sev1`–`sev4`. Se não encontrar, loga um warning e segue.
2. **Acionamento do on-call** — para Sev1/Sev2, dispara o
   [`page-oncall`](#acionamento-de-on-call--action-page-oncall) com
   `dedup-key = org/repo#numero`.
3. **Slack** — para Sev1/Sev2, envia mensagem via
   [`slackapi/slack-github-action@v2.1.0`](https://github.com/slackapi/slack-github-action)
   (incoming webhook) com título e link da issue.

A entrada no Project **não** está aqui de propósito: é papel do workflow nativo
Auto-add do próprio projeto (config na UI, sem token).

### `incident-commands.yml`

| | |
|---|---|
| **Gatilho** | `issue_comment: [created]` |
| **Condição** | issue tem label `incident` **e** o comentário começa com `/` |
| **Permissões** | `issues: write` |

O primeiro token do comentário (minúsculas) é comparado com:

- **`/mitigated`** — adiciona a label `mitigated` e comenta a confirmação com o
  autor (`context.actor`).
- **`/resolve`** — comenta lembrando do postmortem para Sev1/Sev2, fecha a issue
  com `state_reason: completed` e **resolve o acionamento no on-call** (o
  fechamento via `GITHUB_TOKEN` não dispara o `incident-paging.yml`, então o
  resolve sai daqui). O fechamento aciona o workflow nativo do Project
  (status → Done).
- **`/postmortem`** — cria uma issue `Postmortem: <título do incidente>` com
  esqueleto de seções e label `postmortem`, e a vincula como sub-issue via
  API REST `POST /repos/{owner}/{repo}/issues/{issue_number}/sub_issues`
  (atenção: o parâmetro `sub_issue_id` é o **`id` interno** da issue, não o
  `number`). Por fim, comenta o link no incidente.

Comandos desconhecidos são ignorados silenciosamente. Para adicionar um comando,
acrescente um bloco `if (cmd === '/meucomando')` no mesmo script.

### `incident-sla.yml`

| | |
|---|---|
| **Gatilhos** | `schedule: */30 * * * *` (cron) e `workflow_dispatch` (manual) |
| **Permissões** | `issues: write` |

Para cada severidade na tabela `HOURS_WITHOUT_UPDATE` (`sev1: 1`, `sev2: 4`), lista
issues **abertas** com as labels `incident,<sev>` e comenta cobrando status update
naquelas cujo `updated_at` é mais antigo que o limite.

Propriedades importantes:

- **Auto-limitado**: o próprio comentário de cobrança atualiza o `updated_at`,
  então cada issue recebe no máximo uma cobrança por janela de SLA.
- **É cobrança de comunicação, não enforcement contratual** — qualquer atividade
  na issue (inclusive mudar label) zera o relógio. Enforcement real de SLA fica na
  fase 3 (backend), medindo timestamps dos webhooks.
- **Cron do GitHub pode atrasar** em horários de pico (limitação documentada do
  `schedule`); o intervalo de 30 min é indicativo, não garantido.
- **Customização**: edite `HOURS_WITHOUT_UPDATE` para mudar limites ou incluir
  `sev3`.

### `incident-ingest.yml`

| | |
|---|---|
| **Gatilho** | `repository_dispatch: [alert]` — chamado pela ferramenta de monitoramento via API |
| **Permissões** | `issues: write` |
| **Secrets** | `SLACK_WEBHOOK_URL` (notificação Sev1/Sev2) |

Porta de entrada de alertas automáticos (nível 1 do
[NOC automatizado](07-noc-automatizado.md)). Contrato do `client_payload` e
exemplo de `curl` documentados no cabeçalho do próprio arquivo. Comportamento:

- **Dedup por fingerprint**: o identificador do alerta é gravado como comentário
  HTML invisível (`<!-- fingerprint:... -->`) no corpo da issue. Alertas
  repetidos viram comentário no incidente aberto. A busca usa
  `issues.listForRepo` (não a Search API) para evitar atraso de indexação.
- **`status: resolved`**: comenta que o alerta normalizou na origem; **não fecha**
  a issue — fechar automaticamente é decisão do nível 3, após verificação.
- **Autossuficiente**: issues criadas com `GITHUB_TOKEN` não disparam outros
  workflows (prevenção de recursão do Actions), então este workflow aplica a
  label `sevN` e notifica o Slack ele mesmo — o `incident-triage.yml` **não roda**
  para issues ingeridas. As exceções à regra de recursão são `workflow_dispatch`
  e `repository_dispatch`, mecanismo usado para encadear runbooks no nível 3.
- **Severidade default**: payload sem `severity` válida vira `sev3`.
- **Token do monitoramento**: use fine-grained PAT de escopo mínimo (ou a GitHub
  App na fase 3) apenas com acesso ao repo do cliente para chamar `POST
  /repos/{owner}/{repo}/dispatches`.
- **Acionamento**: para Sev1/Sev2 recém-criados, dispara o
  [`page-oncall`](#acionamento-de-on-call--action-page-oncall) — alertas
  deduplicados (comentário em issue existente) **não** acionam de novo; o
  provedor já está com o acionamento aberto sob o mesmo `dedup-key`.

## Acionamento de on-call — action `page-oncall`

Composite action em `.github/actions/page-oncall/action.yml`: a **camada
adaptadora** entre os workflows e o provedor de on-call. Os workflows chamam um
contrato único (`trigger`/`resolve` + summary + severidade + `dedup-key`); o
action traduz para a API do provedor configurado. **Trocar de provedor = trocar
uma variável e um secret no repo do cliente** — nenhum workflow muda.

### Configuração por repositório de cliente

| Config | Tipo | Valores |
|---|---|---|
| `PAGING_PROVIDER` | variable | `goalert` (default da Sunny) · `pagerduty` · `opsgenie` · `none`/ausente (desativado) |
| `PAGING_KEY` | secret | GoAlert: token da integração **Generic API** do service · PagerDuty: **routing key** (Events API v2) · Opsgenie: **GenieKey** da API integration |
| `PAGING_ENDPOINT` | variable | GoAlert: URL base da instância (**obrigatório**) · PagerDuty/Opsgenie: vazio usa o endpoint oficial (Opsgenie UE: `https://api.eu.opsgenie.com`) |

```bash
gh variable set PAGING_PROVIDER --repo sunnysystems/incidents-acme --body goalert
gh variable set PAGING_ENDPOINT --repo sunnysystems/incidents-acme --body https://oncall.sunny.systems
gh secret   set PAGING_KEY      --repo sunnysystems/incidents-acme
```

### Contrato e mapeamento de severidade

| Input | GoAlert (Generic API) | PagerDuty (Events v2) | Opsgenie (Alert API) |
|---|---|---|---|
| `trigger` | `POST /api/v2/generic/incoming` | `event_action: trigger` | `POST /v2/alerts` |
| `resolve` | idem com `action=close` | `event_action: resolve` | `POST /v2/alerts/{alias}/close` |
| `dedup-key` (`org/repo#N`) | `dedup` | `dedup_key` | `alias` |
| `sev1` | prefixo `[SEV1]` no summary | `critical` | `P1` |
| `sev2` | idem | `error` | `P2` |
| `sev3` | idem | `warning` | `P3` |
| `sev4` | idem | `info` | `P4` |

Decisões de comportamento:

- **Escalonamento é do provedor.** O kit dispara **uma vez** por incidente; a
  cadeia de escalonamento, repetição e ack são a política de escalação do
  GoAlert/PagerDuty/Opsgenie. Não reimplementamos escalonamento em cron.
- **`dedup-key` idempotente** (`org/repo#numero`): re-disparos não duplicam o
  acionamento; o `resolve` encontra o acionamento certo.
- **`resolve` é best-effort**: acionamento já resolvido/inexistente vira warning,
  não falha do workflow.
- **Quem resolve**: `/resolve` → `incident-commands.yml`; fechamento manual pela
  UI → `incident-paging.yml` (`issues: closed`). Dois caminhos porque issues
  fechadas via `GITHUB_TOKEN` não disparam workflows.
- **GoAlert não tem severidade** na Generic API: a criticidade vai como prefixo
  `[SEVN]` no summary; a diferenciação de política é feita por **service**
  (integration key) — ex.: um service "ACME crítico" com política agressiva e o
  `PAGING_KEY` do repo apontando para ele.
- ⚠️ **Opsgenie**: suportado porque clientes ainda o têm, mas a Atlassian
  encerra o suporte em **abril/2027** — não usar em cliente novo.

### `incident-paging.yml`

| | |
|---|---|
| **Gatilho** | `issues: [closed]` com label `incident` |
| **Permissões** | `contents: read` |

Resolve o acionamento quando o incidente é fechado manualmente (fora do
`/resolve`). Idempotente com o resolve do `incident-commands.yml`.

## Labels

Provisionadas por `scripts/setup-labels.sh` (idempotente — usa `--force`):

| Label | Cor | Uso |
|---|---|---|
| `incident` | `#B60205` vermelho | Marca a issue como incidente; **chave de toda a automação** e do Auto-add |
| `triage` | `#FBCA04` amarelo | Aguardando classificação humana; remova após validar a severidade |
| `sev1` | `#B60205` vermelho | Indisponibilidade total |
| `sev2` | `#D93F0B` laranja | Degradação severa |
| `sev3` | `#FBCA04` amarelo | Degradação parcial |
| `sev4` | `#0E8A16` verde | Sem impacto em cliente |
| `mitigated` | `#1D76DB` azul | Impacto cessou; causa raiz pendente |
| `postmortem` | `#5319E7` roxo | Issue de análise pós-incidente |

## Dependências externas

| Dependência | Onde | Observação |
|---|---|---|
| `actions/github-script@v7` | todos os workflows | Action oficial do GitHub |
| `slackapi/slack-github-action@v2.1.0` | triage | Oficial do Slack; removível |
| `gh` CLI | scripts | Apenas para provisionamento |

## Segurança e permissões

- Workflows usam o `GITHUB_TOKEN` efêmero do próprio run, escopado ao repositório,
  com permissão mínima declarada (`issues: write`).
- Nenhum PAT pessoal: nada quebra quando alguém sai da empresa.
- Os comandos `/resolve` etc. podem ser executados por **qualquer pessoa que
  comente** na issue. Em repos privados de cliente isso equivale a "qualquer um com
  acesso ao repo", o que é aceitável no piloto. Se precisar restringir, adicione ao
  script uma checagem de `context.actor` contra um time
  (`github.rest.teams.getMembershipForUserInOrg`).
- `SLACK_WEBHOOK_URL` é secret por repositório; vazamento permite apenas postar no
  canal — rotacione no Slack se necessário.
