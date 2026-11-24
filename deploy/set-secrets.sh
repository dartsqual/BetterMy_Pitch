#!/usr/bin/env bash
# Store the Datadog and OpenRouter keys on the VM (root-only files) and start
# the stack. Keys are read without echo and never written locally.
# Usage: deploy/set-secrets.sh <vm-ip>
set -euo pipefail
IP=${1:?usage: set-secrets.sh <vm-ip>}
read -rsp "Datadog API key: " DD_KEY; echo
read -rsp "OpenRouter API key: " OR_KEY; echo
read -rp "Datadog site [datadoghq.com]: " SITE; SITE=${SITE:-datadoghq.com}
# Accept "https://app.datadoghq.com/" or "us5.datadoghq.com" and keep only the site.
SITE=$(echo "$SITE" | sed -E 's#^https?://##; s#/.*$##; s#^app\.##')
printf 'DD_API_KEY=%s\nDD_SITE=%s\n' "$DD_KEY" "$SITE" | ssh "ubuntu@$IP" 'umask 077; cat > /opt/bmp/dd.env'
printf 'OPENROUTER_API_KEY=%s\n' "$OR_KEY" | ssh "ubuntu@$IP" 'umask 077; grep -v "^OPENROUTER_API_KEY=" /opt/bmp/app.env > /opt/bmp/app.env.tmp || true; cat >> /opt/bmp/app.env.tmp; mv /opt/bmp/app.env.tmp /opt/bmp/app.env'
ssh "ubuntu@$IP" 'cd /opt/bmp && docker compose up -d && docker compose ps --format "table {{.Name}}\t{{.Status}}"'
echo "Done. Keys stored on $IP."
