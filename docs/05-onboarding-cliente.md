# Onboarding de cliente novo

Runbook para colocar um cliente novo da Sunny Systems no sistema de incidentes.
Tempo estimado: **~15 minutos**.

## Modelo

Cada cliente tem um repositório privado `incidents-<cliente>` na organização da
Sunny, criado a partir do template `nocpilot`. O cliente acessa **apenas o repo
dele** (como outside collaborator); o consolidado fica no Project org-level, que é
interno.

> Cliente enterprise que exige os dados na organização GitHub **dele**: o fluxo é o
> mesmo, mas o repo nasce na org do cliente e a Sunny acessa via GitHub App
> (fase 3 do estudo). O template e os workflows funcionam sem alteração.

## Passo a passo

```bash
CLIENTE=acme   # slug do cliente, minúsculas

# 1. Repo a partir do template
gh repo create sunnysystems/incidents-$CLIENTE \
  --private --template sunnysystems/nocpilot

# 2. Labels padrão
./scripts/setup-labels.sh sunnysystems/incidents-$CLIENTE

# 3. Secret do Slack (webhook do canal de incidentes — do cliente ou interno)
gh secret set SLACK_WEBHOOK_URL --repo sunnysystems/incidents-$CLIENTE

# 4. On-call: crie um service no GoAlert da Sunny (integração Generic API) e
#    configure o adapter. Cliente com PagerDuty/Opsgenie próprio: troque o
#    PAGING_PROVIDER e use a routing key/GenieKey dele — nada mais muda.
gh variable set PAGING_PROVIDER --repo sunnysystems/incidents-$CLIENTE --body goalert
gh variable set PAGING_ENDPOINT --repo sunnysystems/incidents-$CLIENTE --body https://oncall.sunny.systems
gh secret   set PAGING_KEY      --repo sunnysystems/incidents-$CLIENTE

# 5. Acesso do cliente (repita por pessoa; permissão "triage" abre/comenta issues
#    sem poder de escrita em código)
gh api -X PUT "repos/sunnysystems/incidents-$CLIENTE/collaborators/<usuario-github>" \
  -f permission=triage
```

Depois, na interface:

6. **Project "Incident Response"** → ⚙ → Workflows → **Auto-add**: incluir
   `incidents-<cliente>` no filtro de repositórios. *(Passo mais esquecido — sem
   ele o incidente não entra no board.)*
7. **Campo `Cliente`** do Project: adicionar a opção com o nome do cliente.
8. Ajustar as `options` de **Serviço afetado** em
   `.github/ISSUE_TEMPLATE/incident.yml` do repo novo para os serviços contratados.

## Validação (teste de fumaça)

Abra um incidente Sev4 de teste no repo novo e confirme:

- [ ] Label `sev4` aplicada pelo triage
- [ ] Issue apareceu no Project com o Auto-add
- [ ] `/resolve` fechou a issue e o status virou Done no board
- [ ] Acionamento: em horário combinado com o on-call, um teste **Sev2** dispara
      e resolve no provedor (Sev4 não aciona — por design)
- [ ] Issues de teste excluídas ao final

## O que o cliente vê (e o que não vê)

| Recurso | Cliente vê? |
|---|---|
| Issues do repo `incidents-<cliente>` | ✅ Sim — é o canal oficial dele |
| Repos de outros clientes | ❌ Não (isolamento por repositório) |
| Project org-level consolidado | ❌ Não — uso interno Sunny; **nunca** conceda acesso ao projeto para contas de cliente |
| Notificações | ✅ Por watch do repo / menções, como qualquer repo GitHub |

## Offboarding

```bash
# Remover acesso das pessoas do cliente
gh api -X DELETE "repos/sunnysystems/incidents-$CLIENTE/collaborators/<usuario-github>"

# Arquivar o repo (histórico preservado, somente leitura)
gh repo archive sunnysystems/incidents-$CLIENTE --yes
```

Remova também o repo do filtro Auto-add do Project.
