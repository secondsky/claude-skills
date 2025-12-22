#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <app-name>" >&2
  exit 1
fi

APP_NAME="$1"

echo "Scaffolding TanStack Start (React) for Cloudflare Workers into ./${APP_NAME}"

# 1) Create the project with Cloudflare wiring preconfigured.
npm create cloudflare@latest -- --framework=tanstack-start "${APP_NAME}"

cd "${APP_NAME}"

# 2) Install dependencies if the generator skipped them (idempotent).
npm install

# 3) Generate Workers binding types for safer server functions.
npm run cf-typegen || true

cat <<'EONEXT'
Next steps:
  cd '"${APP_NAME}"'
  npm run dev          # local dev on http://localhost:3000
  npm run build        # production build
  npm run deploy       # deploy via Wrangler (requires CLOUDFLARE_API_TOKEN or wrangler login)

Optional:
  - Add Tailwind v4:   npm install -D @tailwindcss/vite && update vite.config.ts (see references/cloudflare-hosting-and-env.md)
  - Add Query:         npm install @tanstack/react-query @tanstack/react-query-devtools
  - Enable SSR selectively: edit app/start.ts defaultSsr + per-route ssr flag
EONEXT
