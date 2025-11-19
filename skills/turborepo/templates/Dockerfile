FROM node:18-alpine AS base

# Prune workspace
FROM base AS builder
RUN npm install -g turbo
COPY . .
RUN turbo prune --scope=web --docker

# Install dependencies
FROM base AS installer
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
RUN npm install

# Build
COPY --from=builder /app/out/full/ .
RUN npx turbo run build --filter=web

# Runner
FROM base AS runner
COPY --from=installer /app/apps/web/.next/standalone ./
COPY --from=installer /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer /app/apps/web/public ./apps/web/public

CMD node apps/web/server.js
