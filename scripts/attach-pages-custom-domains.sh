#!/usr/bin/env bash
# Point drnote.co at the dn88 Cloudflare Pages project (not the old OpenNext Worker).
set -euo pipefail

ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:?CLOUDFLARE_ACCOUNT_ID is required}"
API_TOKEN="${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN is required}"
PROJECT_NAME="${PAGES_PROJECT_NAME:-dn88}"
LEGACY_WORKER="${LEGACY_WORKER_NAME:-drnote-app-v1}"
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

json_success() {
  python3 -c "import json,sys; print(json.load(sys.stdin).get('success') is True)" 2>/dev/null
}

json_field() {
  local field="$1"
  python3 -c "import json,sys; print(json.load(sys.stdin).get('result',{}).get('${field}',''))" 2>/dev/null
}

echo "Step 1: Detach drnote.co from legacy Worker (${LEGACY_WORKER})..."
worker_domains_json="$(api GET "/accounts/${ACCOUNT_ID}/workers/domains" 2>/dev/null || echo '{"success":false,"result":[]}')"

if [[ "$(echo "$worker_domains_json" | json_success)" != "True" ]]; then
  echo "  Could not list Worker domains (token may need Workers Scripts:Read)."
  echo "  Trying to delete legacy worker script ${LEGACY_WORKER}..."
  if api DELETE "/accounts/${ACCOUNT_ID}/workers/scripts/${LEGACY_WORKER}" >/dev/null 2>&1; then
    echo "  Deleted legacy worker ${LEGACY_WORKER}."
  else
  echo ""
  echo "  MANUAL FIX REQUIRED:"
  echo "  1. Cloudflare Dashboard → Workers & Pages → ${LEGACY_WORKER}"
  echo "  2. Settings → Domains & Routes → Remove drnote.co and www.drnote.co"
  echo "  3. Or delete the ${LEGACY_WORKER} worker entirely"
  echo ""
  fi
else
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
      service="$(echo "$worker_domains_json" | python3 -c "
import json, sys
data = json.load(sys.stdin)
target = sys.argv[1]
for item in data.get('result') or []:
    if item.get('hostname') == target:
        print(item.get('service', ''))
        break
" "$domain" 2>/dev/null || true)"
      echo "  Removing Worker custom domain ${domain} (service=${service}, id=${domain_id})..."
      api DELETE "/accounts/${ACCOUNT_ID}/workers/domains/${domain_id}" || \
        echo "  Warning: could not remove Worker domain ${domain}."
    fi
  done
fi

echo "Step 2: Attach custom domains to Pages project ${PROJECT_NAME}..."
for domain in "${DOMAINS[@]}"; do
  echo "  Adding ${domain}..."
  response="$(api POST "/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/domains" "{\"name\":\"${domain}\"}" 2>/dev/null || true)"

  if [[ "$(echo "$response" | json_success)" == "True" ]]; then
    status="$(echo "$response" | json_field status)"
    echo "  ${domain} -> ${status:-attached}"
  elif echo "$response" | grep -qi 'already exists\|duplicate\|already been taken'; then
    echo "  ${domain} already attached to Pages (ok)"
  elif [[ -z "$response" ]]; then
    echo "  Warning: no response when adding ${domain}"
  else
    echo "  Note: ${domain} response: $(echo "$response" | tr '\n' ' ' | head -c 200)"
  fi
done

echo "Step 3: Verify Pages domain status..."
domains_list="$(api GET "/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/domains" 2>/dev/null || echo '{}')"
echo "$domains_list" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for item in data.get('result') or []:
    print(f\"  {item.get('name')}: {item.get('status')}\")
" 2>/dev/null || true

echo "Done. Once legacy Worker domain is removed, drnote.co serves the dn88 Pages app."
