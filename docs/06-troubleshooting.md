# Troubleshooting e FAQ

## Automação não disparou

**A issue não recebeu a label `sevN` ao abrir**

1. A issue tem a label `incident`? O triage só roda com ela — issues criadas fora
   do formulário (API, e-mail, "blank issue") não a recebem. Aplique `incident`
   manualmente e a automação passa a valer para os próximos eventos (o triage em
   si só roda em `opened`; aplique a `sevN` na mão também).
2. Actions está habilitado no repo? Settings → Actions → General.
3. Veja o log: aba **Actions** → workflow `Incident triage`. Warning
   "Severidade não encontrada" significa que o corpo não continha `Sev1`–`Sev4`.

**Comando `/resolve` (ou outro) não fez nada**

- O comando precisa ser a **primeira palavra** do comentário.
- A issue precisa ter a label `incident`.
- Edição de comentário não dispara (`types: [created]`) — poste um comentário novo.

**A issue não entrou no Project**

- O Auto-add é workflow **do projeto** (⚙ → Workflows), não deste repo. Confira se
  o repositório está no filtro e se o filtro é `label:incident`.
- O repo do cliente novo foi adicionado ao filtro? É o passo mais esquecido do
  [onboarding](05-onboarding-cliente.md).

**O lembrete de SLA não rodou no horário**

- O `schedule` do GitHub Actions **pode atrasar** em horários de pico — é limitação
  documentada da plataforma, não bug do workflow.
- Cron não roda em repositório sem atividade por 60+ dias (o GitHub desabilita
  workflows agendados de repos inativos e avisa por e-mail; reative na aba Actions).
- Para testar sem esperar o cron: aba Actions → `Incident SLA reminder` →
  **Run workflow**.

## Erros na criação de issue

**"type: Incident" falha ao abrir o formulário**

O issue type `Incident` não existe na organização. Crie em Org → Settings →
Planning → Issue types, ou remova a linha `type: Incident` do `incident.yml`.

**O dropdown de severidade veio preenchido com Sev1 sem ninguém escolher**

Caveat conhecido dos issue forms (dropdown auto-seleciona a primeira opção mesmo
com `required`). Decisão consciente do kit: errar para **cima** (Sev1) gera falso
alarme, nunca subnotificação. Corrija a label e siga.

## Erros nos workflows

**`POST .../sub_issues` retorna 404 ou 422 no `/postmortem`**

- 404: a API de sub-issues exige que o recurso esteja disponível no plano/rollout
  da org (sub-issues é GA desde 2025, mas orgs Enterprise Server antigas podem não
  ter).
- 422: o `sub_issue_id` deve ser o **`id` interno** da issue (o script já usa
  `pm.id`); também ocorre se a issue já tem 100 sub-issues (limite do GitHub).
- Em ambos os casos a issue de postmortem **foi criada** — só o vínculo falhou;
  vincule manualmente (⋯ da issue → "Mark as sub-issue" / arraste no painel de
  sub-issues do incidente).

**Slack não recebeu a notificação**

1. O secret `SLACK_WEBHOOK_URL` existe no repo? (`gh secret list --repo ...`)
2. O corpo da issue contém literalmente `Sev1` ou `Sev2`? A condição do passo usa
   `contains()` no corpo.
3. Veja o log do passo no run — o Slack action reporta erro de webhook inválido.

**"Resource not accessible by integration" no log**

O bloco `permissions:` do workflow foi alterado/removido, ou a org restringe o
`GITHUB_TOKEN` a read-only por padrão (Settings → Actions → Workflow permissions).
Os workflows declaram `issues: write` explicitamente, o que deve bastar — confirme
que a política da org não bloqueia elevação por workflow.

## Perguntas frequentes

**Posso usar em repositório pessoal (sem organização)?**
Os workflows e formulários funcionam, mas issue types, issue fields e Projects
org-level (com Auto-add multi-repo) são recursos de **organização**. O consolidado
multi-cliente exige org.

**Como mudo os limites de SLA?**
Edite `HOURS_WITHOUT_UPDATE` em `.github/workflows/incident-sla.yml`
(ex.: `{ sev1: 1, sev2: 4, sev3: 24 }`).

**Como adiciono um comando novo (ex.: `/sev 2` para reclassificar)?**
Acrescente um bloco `if (cmd === '/sev')` no script de
`incident-commands.yml`; o restante do comentário está em
`context.payload.comment.body`.

**E se o GitHub estiver fora do ar?**
O sistema cai junto — risco assumido no [estudo](../estudo-github-gestao-de-incidentes.md),
seção 5. Mantenha um runbook de contingência fora do GitHub (doc compartilhado +
canal Slack) para incidentes do tipo "o GitHub caiu".

**Quando preciso da fase 3 (GitHub App/backend)?**
Quando quiser: dashboard consolidado multi-cliente fora do GitHub, MTTA/MTTR
calculados automaticamente, enforcement real de SLA por contrato, ou clientes com
os incidentes na organização GitHub deles. Arquitetura na seção 4 do estudo.
