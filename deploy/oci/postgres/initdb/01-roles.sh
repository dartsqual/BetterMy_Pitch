#!/bin/bash
# First-boot setup: sync writer + Bruin analytics role (read app.*, write analytics.*).
set -euo pipefail
psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -v sync_pw="$SYNC_PASSWORD" -v bruin_pw="$BRUIN_PASSWORD" <<'SQL'
CREATE ROLE bmp_sync LOGIN PASSWORD :'sync_pw';
CREATE ROLE bruin LOGIN PASSWORD :'bruin_pw' CONNECTION LIMIT 10;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
CREATE SCHEMA app AUTHORIZATION bmp_sync;
CREATE SCHEMA analytics AUTHORIZATION bruin;
GRANT USAGE ON SCHEMA app TO bruin;
ALTER DEFAULT PRIVILEGES FOR ROLE bmp_sync IN SCHEMA app GRANT SELECT ON TABLES TO bruin;
ALTER ROLE bruin SET statement_timeout = '60s';
SQL
