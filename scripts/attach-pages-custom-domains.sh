#!/usr/bin/env bash
# Point drnote.co at the dn88 Cloudflare Pages project (not the old OpenNext Worker).
set -euo pipefail

ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:?CLOUDFLARE_ACCOUNT_ID is required}"
API_TOKEN="${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN is required}"
PROJECT_NAME="${PAGES_PROJECT_NAME:-dn88}"
DOMAINS=("drnote.co" "www.drnote.co")

api() {
  local method="$1"
  local path="$2"
  local data="${3:-}"

  if [[ -n "$data" ]]; then
    curl -fsS -X "$method" \
      "https://api.cloudflare.com/client/v4${path}" \
      -H "Authorization: Bearer ${API_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "$data"
  else
    curl -fsS -X "$method" \
      "https://api.cloudflare.com/client/v4${path}" \
      -H "Authorization: Bearer ${API_TOKEN}" \
      -H "Content-Type: application/json"
  fi
}

echo "Checking for Worker custom domains that block Pages routing..."
worker_domains_json="$(api GET "/accounts/${ACCOUNT_ID}/workers/domains" || echo '{"success":false,"result":[]}')"

for domain in "${DOMAINS[@]}"; do
  domain_id="$(echo "$worker_domains_json" | python3 -c "
import json, sys
data = json.load(sys.stdin)
target = sys.argv[1]
for item in data.get('result') or []:
    if item.get('hostname') == target:
        print(item.get('id', ''))
        break
" "$domain" 2>/dev/null || true)"

  if [[ -n "$domain_id" ]]; then
    echo "Removing Worker custom domain ${domain} (id=${domain_id})..."
    api DELETE "/accounts/${ACCOUNT_ID}/workers/domains/${domain_id}" || \
      echo "Warning: could not remove Worker domain ${domain}; remove it manually in the dashboard."
  fi
done

echo "Attaching custom domains to Pages project ${PROJECT_NAME}..."
for domain in "${DOMAINS[@]}"; do
  echo "Adding ${domain}..."
  response="$(api POST "/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/domains" "{\"name\":\"${domain}\"}" || true)"

  if echo "$response" | grep -q '"success":true'; then
    status="$(echo "$response" | python3 -c "import json,sys; print(json.load(sys.stdin).get('result',{}).get('status','unknown'))" 2>/dev/null || echo unknown)"
    echo "  ${domain} -> ${status}"
  elif echo "$response" | grep -qi 'already exists\|duplicate\|already been taken'; then
    echo "  ${domain} already attached to Pages (ok)"
  else
    echo "  Warning: could not add ${domain}: ${response}"
  fi
done

echo "Done. drnote.co should serve the dn88 Pages deployment within a few minutes."
