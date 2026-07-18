#!/usr/bin/env bash
# Push Worker secrets from environment variables (never commit values to git).
# Usage:
#   export OPENROUTER_API_KEY=...
#   export CONTEXT_DEV_API_KEY=...
#   bash scripts/set-worker-secrets.sh

set -euo pipefail

WRANGLER_CONFIG="${WRANGLER_CONFIG:-workers/dn88/wrangler.jsonc}"

put_secret() {
  local name="$1"
  local value="$2"
  if [ -z "$value" ]; then
    echo "skip $name (empty)"
    return 0
  fi
  printf '%s' "$value" | npx wrangler secret put "$name" -c "$WRANGLER_CONFIG"
  echo "set $name"
}

put_secret OPENROUTER_API_KEY "${OPENROUTER_API_KEY:-}"
put_secret CONTEXT_DEV_API_KEY "${CONTEXT_DEV_API_KEY:-}"
put_secret STRIPE_WEBHOOK_SECRET "${STRIPE_WEBHOOK_SECRET:-}"
put_secret STRIPE_PRICE_STUDENT_MONTHLY "${STRIPE_PRICE_STUDENT_MONTHLY:-}"
put_secret STRIPE_PRICE_STUDENT_YEARLY "${STRIPE_PRICE_STUDENT_YEARLY:-}"
put_secret STRIPE_PRICE_PRO_MONTHLY "${STRIPE_PRICE_PRO_MONTHLY:-}"
put_secret STRIPE_PRICE_PRO_YEARLY "${STRIPE_PRICE_PRO_YEARLY:-}"

echo "Done."
