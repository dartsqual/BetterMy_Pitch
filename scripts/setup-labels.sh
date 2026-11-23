#!/usr/bin/env bash
# Provisiona as labels padrão de incidentes em um repositório.
# Uso: ./scripts/setup-labels.sh <org>/<repo>
set -euo pipefail

REPO="${1:?uso: $0 <org>/<repo>}"

create() {
  gh label create "$1" --repo "$REPO" --color "$2" --description "$3" --force
}

create incident   B60205 "Incidente em produção"
create triage     FBCA04 "Aguardando triagem"
create sev1       B60205 "Sev1 — indisponibilidade total"
create sev2       D93F0B "Sev2 — degradação severa"
create sev3       FBCA04 "Sev3 — degradação parcial"
create sev4       0E8A16 "Sev4 — sem impacto em cliente"
create mitigated  1D76DB "Impacto mitigado, causa raiz pendente"
create postmortem 5319E7 "Análise pós-incidente"

echo "Labels criadas em $REPO"
