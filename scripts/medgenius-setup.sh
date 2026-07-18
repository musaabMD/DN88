#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WRANGLER=(npx wrangler -c "$ROOT/workers/dn88/wrangler.jsonc")

echo "==> Creating R2 bucket (if needed)"
"${WRANGLER[@]}" r2 bucket create dn88-user-content 2>/dev/null || true

echo "==> Creating processing queue (if needed)"
"${WRANGLER[@]}" queues create medgenius-processing 2>/dev/null || true

echo "==> Applying MedGenius D1 migration (remote)"
npm run medgenius:migrate --prefix "$ROOT"

echo "==> Deploying DN88 worker"
npm run worker:deploy --prefix "$ROOT"

echo "Done. Set secrets with: npx wrangler secret put <NAME> -c workers/dn88/wrangler.jsonc"
