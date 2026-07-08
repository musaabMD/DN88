#!/usr/bin/env bash
# Point drnote.co at the dn88 Cloudflare Pages project (not the old OpenNext Worker).
set -uo pipefail

ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:?CLOUDFLARE_ACCOUNT_ID is required}"
API_TOKEN="${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN is required}"
PROJECT_NAME="${PAGES_PROJECT_NAME:-dn88}"
PAGES_TARGET="${PAGES_CNAME_TARGET:-dn88.pages.dev}"
ZONE_NAME="${CLOUDFLARE_ZONE_NAME:-drnote.co}"
LEGACY_WORKER="${LEGACY_WORKER_NAME:-drnote-app-v1}"
LEGACY_WORKERS=("${LEGACY_WORKER}" "new-drnote-redirect")
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

get_zone_id() {
  if [[ -n "${CLOUDFLARE_ZONE_ID:-}" ]]; then
    echo "$CLOUDFLARE_ZONE_ID"
    return
  fi
  api GET "/zones?name=${ZONE_NAME}&status=active" | python3 -c "
import json, sys
data = json.load(sys.stdin)
zones = data.get('result') or []
print(zones[0]['id'] if zones else '')
"
}

ensure_pages_cname() {
  local zone_id="$1"
  local record_name="$2"
  local fqdn="${record_name}.${ZONE_NAME}"
  if [[ "$record_name" == "@" || "$record_name" == "$ZONE_NAME" ]]; then
    fqdn="$ZONE_NAME"
    record_name="@"
  fi

  echo "  Ensuring CNAME ${fqdn} -> ${PAGES_TARGET} (proxied)..."

  existing="$(api GET "/zones/${zone_id}/dns_records?type=CNAME&name=${fqdn}" 2>/dev/null || echo '{"success":false,"result":[]}')"
  record_id="$(echo "$existing" | python3 -c "
import json, sys
data = json.load(sys.stdin)
items = data.get('result') or []
print(items[0]['id'] if items else '')
" 2>/dev/null || true)"
  current_content="$(echo "$existing" | python3 -c "
import json, sys
data = json.load(sys.stdin)
items = data.get('result') or []
print(items[0].get('content','') if items else '')
" 2>/dev/null || true)"

  payload="$(python3 -c "
import json
print(json.dumps({
  'type': 'CNAME',
  'name': '${record_name}',
  'content': '${PAGES_TARGET}',
  'ttl': 1,
  'proxied': True,
}))
")"

  if [[ -n "$record_id" ]]; then
    if [[ "$current_content" == "${PAGES_TARGET}" || "$current_content" == "${PAGES_TARGET}." ]]; then
      echo "    already correct"
      return
    fi
    api PATCH "/zones/${zone_id}/dns_records/${record_id}" "$payload" >/dev/null && \
      echo "    updated existing record" || echo "    warning: could not update ${fqdn}"
  else
    api POST "/zones/${zone_id}/dns_records" "$payload" >/dev/null && \
      echo "    created record" || echo "    warning: could not create ${fqdn} (token may need Zone DNS Edit)"
  fi
}

remove_origin_vercel_chain() {
  local zone_id="$1"
  echo "  Removing stale origin.drnote.co -> Vercel chain if present..."
  for fqdn in "origin.drnote.co" "drnote.co"; do
    records="$(api GET "/zones/${zone_id}/dns_records?type=CNAME&name=${fqdn}" 2>/dev/null || echo '{"success":false,"result":[]}')"
    echo "$records" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for item in data.get('result') or []:
    content = item.get('content', '')
    if 'vercel' in content or 'origin.drnote.co' in content:
        print(item['id'])
" 2>/dev/null | while read -r rid; do
      [[ -z "$rid" ]] && continue
      api DELETE "/zones/${zone_id}/dns_records/${rid}" >/dev/null 2>&1 && \
        echo "    deleted stale record ${rid}" || true
    done || true
  done
}

echo "Step 1: Detach drnote.co from legacy Workers (${LEGACY_WORKERS[*]})..."
worker_domains_json="$(api GET "/accounts/${ACCOUNT_ID}/workers/domains" 2>/dev/null || echo '{"success":false,"result":[]}')"

if [[ "$(echo "$worker_domains_json" | json_success)" != "True" ]]; then
  echo "  Could not list Worker domains (token may need Workers Scripts:Read)."
  echo "  Trying to delete legacy worker scripts..."
  for worker in "${LEGACY_WORKERS[@]}"; do
    if api DELETE "/accounts/${ACCOUNT_ID}/workers/scripts/${worker}" >/dev/null 2>&1; then
      echo "  Deleted legacy worker ${worker}."
    fi
  done
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
    echo "  Note: ${domain}: $(echo "$response" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('errors',[{}])[0].get('message','ok') if not d.get('success') else d.get('result',{}).get('status','attached'))" 2>/dev/null || echo 'see logs')"
  fi
done

echo "Step 3: Ensure DNS records point to ${PAGES_TARGET}..."
ZONE_ID="$(get_zone_id)"
if [[ -z "$ZONE_ID" ]]; then
  echo "  Warning: could not resolve zone id for ${ZONE_NAME} (token may need Zone Read)."
else
  echo "  Zone ${ZONE_NAME} -> ${ZONE_ID}"
  remove_origin_vercel_chain "$ZONE_ID"
  ensure_pages_cname "$ZONE_ID" "@"
  ensure_pages_cname "$ZONE_ID" "www"
fi

echo "Step 4: Verify Pages domain status..."
domains_list="$(api GET "/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/domains" 2>/dev/null || echo '{}')"
echo "$domains_list" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for item in data.get('result') or []:
    print(f\"  {item.get('name')}: {item.get('status')}\")
" 2>/dev/null || true

echo "Done. drnote.co and www.drnote.co should serve the dn88 Pages app."
