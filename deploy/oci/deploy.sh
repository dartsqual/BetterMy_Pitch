#!/usr/bin/env bash
# Deploy the current git HEAD to the VM and (re)start the stack.
# Usage: deploy/oci/deploy.sh <public-ip>
set -euo pipefail
IP=${1:?usage: deploy.sh <public-ip>}
HOST=ubuntu@$IP
ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
VERSION=$(git -C "$ROOT" rev-parse --short HEAD)
SSH="ssh -o StrictHostKeyChecking=accept-new $HOST"

git -C "$ROOT" archive --format=tar HEAD | $SSH 'rm -rf /opt/bmp/src && mkdir -p /opt/bmp/src && tar -x -C /opt/bmp/src'
scp -q "$ROOT/deploy/oci/docker-compose.yml" "$ROOT/deploy/oci/Caddyfile" "$HOST:/opt/bmp/"
$SSH "cat > /opt/bmp/.env <<ENV
SITE_ADDRESS=${SITE_ADDRESS:-$(echo "$IP" | tr . -).sslip.io}
APP_VERSION=$VERSION
DD_ENV=${DD_ENV:-prod}
ENV
cd /opt/bmp && test -f dd.env && test -f app.env && docker compose up -d --build && docker compose ps"
