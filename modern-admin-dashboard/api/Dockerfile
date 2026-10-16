# syntax=docker/dockerfile:1
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY api/package.json ./api/

RUN pnpm install --frozen-lockfile --filter @modern-admin/api...

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/api/node_modules ./api/node_modules
COPY api ./api
COPY package.json ./

USER node

EXPOSE 8080

CMD ["node", "api/src/server.js"]
