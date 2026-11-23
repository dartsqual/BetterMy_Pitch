# Guia de uso — operação do dia a dia

Para quem abre, responde e acompanha incidentes.

## Abrindo um incidente

1. No repositório do cliente: **Issues** → **New issue** → **🚨 Incidente**.
2. Preencha o formulário. Campos obrigatórios:
   - **Severidade** — use a régua abaixo;
   - **Serviço afetado**;
   - **Início do impacto** (data/hora com fuso);
   - **Impacto observado** — o que está quebrado, quantos afetados, workaround.
3. Envie. A automação faz o resto: label de severidade, entrada no board e, para
   Sev1/Sev2, notificação no Slack.

### Régua de severidade

| Sev | Critério | Expectativa de atualização |
|---|---|---|
| **Sev1** | Indisponibilidade total ou perda de dados | Status update a cada **1h** |
| **Sev2** | Degradação severa; funcionalidade principal comprometida | Status update a cada **4h** |
| **Sev3** | Degradação parcial; existe workaround | Sem cobrança automática |
| **Sev4** | Sem impacto em cliente (interno, risco identificado) | Sem cobrança automática |

Na dúvida entre duas severidades, escolha a **mais alta** — rebaixar depois é fácil.

## Durante o incidente

**A timeline da issue é o registro oficial.** Decisões, descobertas e ações tomadas
devem virar comentários na issue, mesmo que a coordenação em tempo real aconteça no
Slack — cole o resumo na issue. É desses comentários que sai o postmortem.

Boas práticas de status update:

```
**Status:** investigando
**O que sabemos:** picos de 5xx na API desde 14:30, correlacionados com o deploy #482
**Próximo passo:** rollback em andamento, ETA 15 min
```

Se um Sev1/Sev2 ficar sem atualização além da janela, o robô de SLA cobra com um
comentário — responda com um status update, mesmo que seja "sem novidades, seguimos
investigando".

## Comandos

Comente na issue do incidente (o comando deve ser a primeira palavra do comentário):

| Comando | Efeito |
|---|---|
| `/mitigated` | Aplica a label `mitigated` e registra quem mitigou. Use quando o impacto ao cliente cessou mas a causa raiz ainda não foi corrigida (ex.: rollback feito). |
| `/resolve` | Fecha a issue como concluída. Use quando a correção definitiva está aplicada e verificada. |
| `/postmortem` | Cria a issue de postmortem pré-preenchida e a vincula como **sub-issue** do incidente. |

## Postmortem

Obrigatório para **Sev1 e Sev2**; recomendado quando houver aprendizado relevante.

1. Rode `/postmortem` na issue do incidente (ou abra manualmente pelo formulário
   **📝 Postmortem**).
2. Preencha: resumo, linha do tempo (copie da timeline da issue), causa raiz,
   o que funcionou/não funcionou, ações corretivas.
3. Transforme cada ação corretiva em **sub-issue** do incidente (ou do postmortem)
   e atribua responsável — é isso que garante que ação corretiva não morre no
   documento.
4. Postmortem é **blameless**: descreve sistemas e processos, não culpados.

## Acompanhamento (gestão)

- **Project "Incident Response"** (org-level): board por status, tabela por
  severidade, view por cliente.
- **Insights** do Project: gráficos de abertos por severidade e throughput.
- A issue fechada vai para **Done** automaticamente; arquive itens antigos com o
  auto-archive do projeto.

## Erros comuns

- **Abrir incidente sem o formulário** (issue em branco está desabilitada, mas dá
  para errar via API): sem as labels, nenhuma automação dispara. Feche e reabra
  pelo formulário, ou aplique as labels `incident` + `sevN` manualmente.
- **Severidade errada aplicada pelo triage**: o robô lê "Sev N" do corpo; se o
  texto foi editado de forma ambígua, corrija a label na mão — a automação não
  briga com ajustes manuais.
- **Comando no meio do texto**: `/resolve` só funciona como primeira palavra do
  comentário.
