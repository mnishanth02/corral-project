# syntax=docker/dockerfile:1
FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /repo

FROM base AS pruner
COPY . .
RUN pnpm dlx turbo prune @corral/worker --docker

FROM base AS builder
COPY --from=pruner /repo/out/json/ .
COPY --from=pruner /repo/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile
COPY --from=pruner /repo/out/full/ .
RUN pnpm turbo run build --filter=@corral/worker...

FROM node:22-slim AS runner
ENV NODE_ENV="production"
WORKDIR /app
# Install Chromium/Puppeteer system dependencies here when PDF generation is added.
# Preserve the pnpm workspace layout so the app's node_modules symlinks
# (workspace packages and the .pnpm store) resolve correctly at runtime.
COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/packages ./packages
COPY --from=builder /repo/apps/worker/package.json ./apps/worker/package.json
COPY --from=builder /repo/apps/worker/node_modules ./apps/worker/node_modules
COPY --from=builder /repo/apps/worker/dist ./apps/worker/dist
USER node
EXPOSE 3100
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3100/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
WORKDIR /app/apps/worker
CMD ["node", "dist/main"]
