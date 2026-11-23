# Instalação e configuração inicial

Roteiro completo para colocar o sistema em produção pela primeira vez.
Feito uma única vez por organização; o onboarding de cada cliente novo está em
[05-onboarding-cliente.md](05-onboarding-cliente.md).

## Pré-requisitos

- Organização no GitHub (qualquer plano; no **Free**, Actions tem 2.000 min/mês em
  repos privados — suficiente para estas automações, que são leves).
- Permissão de **owner** na organização (para issue types e Projects org-level).
- [`gh` CLI](https://cli.github.com/) autenticado (`gh auth login`) para os scripts.
- (Opcional) Um canal Slack com [incoming webhook](https://api.slack.com/messaging/webhooks)
  para notificações de Sev1/Sev2.

## Passo 1 — Publicar este repositório como template

```bash
cd _github-incident-management
git init && git add -A && git commit -m "Kit de gestão de incidentes"
gh repo create sunnysystems/nocpilot --private --source . --push
gh repo edit sunnysystems/nocpilot --template
```

Marcar como *template repository* permite criar os repos de cliente com
`gh repo create --template` já contendo formulários e workflows.

## Passo 2 — Issue type `Incident` (organização)

1. Org → **Settings** → **Planning** → **Issue types**.
2. Criar o tipo **Incident** (cor vermelha, descrição "Incidente em produção").

> O formulário `incident.yml` declara `type: Incident`. Se o tipo não existir na
> organização, a criação da issue falha — crie o tipo **antes** do primeiro repo,
> ou remova a linha `type:` do formulário.

## Passo 3 — Project "Incident Response" (organização)

1. Org → **Projects** → **New project** → template *Board*.
2. Criar os campos (⚙ do projeto → **Fields**):
   - `Status do incidente` — single-select: `Investigando`, `Identificado`,
     `Monitorando`, `Resolvido`.
   - `SLA due` — date.
   - `Cliente` — single-select com um valor por cliente.
3. Ativar os workflows nativos (⚙ do projeto → **Workflows**):
   - **Auto-add to project**: filtro `label:incident`, marcando os repositórios
     `incidents-*`. É isso que coloca cada incidente novo no board — sem código.
   - **Item closed → Status: Done**: já vem ativo por padrão; confirme.
4. Criar as views: board por `Status do incidente`; tabela ordenada por severidade;
   view filtrada por `Cliente`.

> O Auto-add tem um filtro por repositórios: a cada cliente novo é preciso
> **incluir o repo novo no filtro** (passo repetido no onboarding).

## Passo 4 — Labels

Para cada repositório de incidentes:

```bash
./scripts/setup-labels.sh sunnysystems/incidents-<cliente>
```

Cria: `incident`, `triage`, `sev1`–`sev4`, `mitigated`, `postmortem`
(cores e descrições na [referência técnica](04-referencia-tecnica.md#labels)).

## Passo 5 — Secret do Slack

```bash
gh secret set SLACK_WEBHOOK_URL --repo sunnysystems/incidents-<cliente>
```

Cole a URL do incoming webhook quando solicitado. Sem Slack? Remova o passo
"Notificar Slack" do `incident-triage.yml`.

## Passo 6 — On-call / acionamento (GoAlert)

Uma vez (infra da Sunny): subir a instância do GoAlert (binário Go + Postgres +
conta Twilio para SMS/voz — ver [target/goalert](https://github.com/target/goalert)),
criar as escalas de plantão e as políticas de escalonamento do time.

Por repositório de cliente: criar um **service** no GoAlert (com integração
**Generic API**) e configurar:

```bash
gh variable set PAGING_PROVIDER --repo sunnysystems/incidents-<cliente> --body goalert
gh variable set PAGING_ENDPOINT --repo sunnysystems/incidents-<cliente> --body https://oncall.sunny.systems
gh secret   set PAGING_KEY      --repo sunnysystems/incidents-<cliente>   # token da Generic API do service
```

Cliente que já tem PagerDuty/Opsgenie: mesmo contrato, outro valor em
`PAGING_PROVIDER` — ver a
[tabela de configuração](04-referencia-tecnica.md#acionamento-de-on-call--action-page-oncall).
Sem provedor definido (`PAGING_PROVIDER` ausente), o acionamento fica desativado
e o resto do kit funciona normalmente.

## Passo 7 — Teste de fumaça

1. Abra uma issue pelo formulário **🚨 Incidente** escolhendo `Sev1`.
2. Confira, na aba **Actions**, que `Incident triage` rodou; a issue deve receber a
   label `sev1`, o **acionamento deve disparar no GoAlert** (alerta no service) e a
   notificação deve chegar no Slack.
3. Confira que a issue apareceu no Project (Auto-add).
4. Comente `/mitigated` → label `mitigated` + comentário de confirmação.
5. Comente `/postmortem` → issue de postmortem criada como **sub-issue**.
6. Comente `/resolve` → issue fechada; no Project, status vira **Done**; o
   **acionamento fecha no GoAlert**.
7. (Opcional) Rode o SLA manualmente: aba Actions → `Incident SLA reminder` →
   **Run workflow** — não deve comentar em issues recém-atualizadas.

## Checklist final

- [ ] Repo template publicado (`nocpilot`)
- [ ] Issue type `Incident` criado na org
- [ ] Project org-level com campos, views e Auto-add configurados
- [ ] Labels provisionadas no(s) repo(s)
- [ ] `SLACK_WEBHOOK_URL` configurado (ou passo removido)
- [ ] GoAlert no ar + `PAGING_PROVIDER`/`PAGING_ENDPOINT`/`PAGING_KEY` no(s) repo(s)
- [ ] Teste de fumaça completo (passos 1–6 acima)
