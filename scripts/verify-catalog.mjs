#!/usr/bin/env node
/**
 * Verify catalog platform health — run after sync/deploy.
 * Usage: CATALOG_API_URL=http://localhost:8787 node scripts/verify-catalog.mjs
 */

const API = process.env.CATALOG_API_URL?.trim() || "http://localhost:8787";

async function get(path) {
  const res = await fetch(`${API}${path}`);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

async function main() {
  const report = {
    api: API,
    timestamp: new Date().toISOString(),
    checks: [],
  };

  const health = await get("/health");
  report.checks.push({
    name: "health",
    ok: health.status === 200 && health.json.ok === true,
    detail: health.json,
  });

  const state = await get("/api/catalog/state");
  report.checks.push({
    name: "catalog_state",
    ok: state.status === 200,
    detail: state.json,
  });

  const articles = await get("/api/catalog/articles");
  const articleList = articles.json.articles ?? [];
  report.checks.push({
    name: "public_articles",
    ok: articles.status === 200,
    detail: { count: articleList.length, syncState: articles.json.syncState },
  });

  const hypertension = await get("/api/catalog/articles/cardiology-hypertension");
  report.checks.push({
    name: "hypertension_public",
    ok: hypertension.status === 200,
    detail:
      hypertension.status === 200
        ? {
            title: hypertension.json.title,
            sections: hypertension.json.sections?.length,
          }
        : hypertension.json,
  });

  const search = await get("/api/catalog/search?q=hypertension");
  report.checks.push({
    name: "search",
    ok: search.status === 200,
    detail: { results: search.json.results?.length ?? 0 },
  });

  const passed = report.checks.filter((c) => c.ok).length;
  const total = report.checks.length;

  console.log("Catalog Verification Report");
  console.log("=========================");
  console.log(`API: ${API}`);
  console.log(`Passed: ${passed}/${total}`);
  console.log("");
  for (const check of report.checks) {
    console.log(`${check.ok ? "✓" : "✗"} ${check.name}`);
    console.log(`  ${JSON.stringify(check.detail)}`);
  }

  if (passed < total) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
