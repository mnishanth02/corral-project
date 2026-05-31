# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

FROM base AS pruner
COPY . .
RUN pnpm dlx turbo prune @corral/console --docker

FROM base AS builder
COPY --from=pruner /repo/out/json/ .
COPY --from=pruner /repo/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile
COPY --from=pruner /repo/out/full/ .
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm turbo run build --filter=@corral/console

FROM nginxinc/nginx-unprivileged:alpine AS runner
COPY apps/console/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /repo/apps/console/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
