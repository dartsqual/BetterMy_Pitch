# syntax=docker/dockerfile:1
# BetterMy Pitch — production image (multi-arch: built natively on the ARM VM).

FROM node:24-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS build
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build && npm prune --omit=dev

FROM base AS runtime
ARG DD_GIT_COMMIT_SHA=unknown
ARG DD_GIT_REPOSITORY_URL=https://github.com/dartsqual/BetterMy_Pitch
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    DD_GIT_COMMIT_SHA=${DD_GIT_COMMIT_SHA} \
    DD_GIT_REPOSITORY_URL=${DD_GIT_REPOSITORY_URL}
COPY --from=build --chown=node:node /app ./
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# Apply DB migrations, then start Next.js with the Datadog tracer preloaded.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && exec node --require dd-trace/init node_modules/next/dist/bin/next start -H 0.0.0.0 -p 3000"]
