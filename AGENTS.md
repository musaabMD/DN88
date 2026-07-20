<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

DrNote is a **static, client-only Next.js 16 (React 19, Tailwind v4) front-end** with an optional **Cloudflare Worker API (DN88)** and **Clerk auth**.

- Commands: `npm run dev`, `npm run build`, `npm run lint`, `npm run deploy`, `npm run worker:dev`, `npm run worker:deploy`
- **Hosting:** Cloudflare Pages (`dn88.pages.dev`, custom domain `drnote.co`) — deploy with `npm run deploy`
- **Custom domain:** CI runs `scripts/attach-pages-custom-domains.sh` to bind `drnote.co` to the `dn88` Pages project and detach any old Worker custom domain
- **Backend:** Cloudflare Worker **DN88** in `workers/dn88/`
- **Auth:** Clerk via `.env.local` (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`)
- Deploy needs `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` (`5000e0a4f0ca6dd90b08bde9dc11ccb9`) in the agent environment
- Authenticate the **Cloudflare Builds** MCP server in Cursor (Settings → MCP) for agent-side deploys

## RAG / exam-recall extraction (Trigger.dev)

Lab page: `/rag`. Background tasks live in `trigger/` (project `proj_urgydtjlxezekgtpcxst`).

- Commands: `npm run trigger:dev`, `npm run trigger:deploy`
- Worker proxy: `/api/rag/*` (requires `TRIGGER_SECRET_KEY` on DN88)
- Schemas / prompts: `src/lib/rag/`
- **Coding-agent rule:** follow `docs/rag-extraction-spec.md` for all PDF question extraction work.

### Critical extraction rules (summary)

- Never assume `one page = one question`. A page may contain zero, one, or many questions; a question may span regions/pages.
- Preserve exact source wording in `versions.source` (including mistakes and uncertainty). Do not silently rewrite.
- Distinguish `origin: "extracted" | "reconstructed" | "generated"` and label reconstructed/generated in the UI.
- Associate images only when required to answer — not merely because they share a page.
- Do not generate MCQs during extraction; generation is a separate step with its own prompt.
- Validate all outputs with Zod schemas in `src/lib/rag/schemas.ts`.
