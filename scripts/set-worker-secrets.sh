#!/usr/bin/env bash
# Push Worker secrets from environment variables (never commit values to git).
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

put_secret CLERK_SECRET_KEY "${CLERK_SECRET_KEY:-}"
put_secret CLERK_PUBLISHABLE_KEY "${CLERK_PUBLISHABLE_KEY:-}"
put_secret CLERK_WEBHOOK_SECRET "${CLERK_WEBHOOK_SECRET:-}"
put_secret STRIPE_SECRET_KEY "${STRIPE_SECRET_KEY:-}"
put_secret STRIPE_WEBHOOK_SECRET "${STRIPE_WEBHOOK_SECRET:-}"
put_secret STRIPE_PRICE_MONTHLY "${STRIPE_PRICE_MONTHLY:-}"
put_secret STRIPE_PRICE_YEARLY "${STRIPE_PRICE_YEARLY:-}"
put_secret STRIPE_PRICE_STUDENT_MONTHLY "${STRIPE_PRICE_STUDENT_MONTHLY:-}"
put_secret STRIPE_PRICE_STUDENT_YEARLY "${STRIPE_PRICE_STUDENT_YEARLY:-}"
put_secret STRIPE_PRICE_PRO_MONTHLY "${STRIPE_PRICE_PRO_MONTHLY:-}"
put_secret STRIPE_PRICE_PRO_YEARLY "${STRIPE_PRICE_PRO_YEARLY:-}"
put_secret CATALOG_SYNC_SECRET "${CATALOG_SYNC_SECRET:-}"
put_secret OPENAI_API_KEY "${OPENAI_API_KEY:-}"
put_secret OPENROUTER_API_KEY "${OPENROUTER_API_KEY:-}"
put_secret CONTEXT_DEV_API_KEY "${CONTEXT_DEV_API_KEY:-}"
put_secret ADMIN_BOOTSTRAP_IDS "${ADMIN_BOOTSTRAP_IDS:-}"

echo "Done."
