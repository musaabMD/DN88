<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

DrNote is a **static, client-only Next.js 16 (React 19, Tailwind v4) front-end**. No backend, database, or env vars are required for local dev/build/lint.

- Commands: `npm run dev`, `npm run build`, `npm run lint`, `npm run deploy`
- Cloudflare account ID is in `wrangler.jsonc`. Production deploy needs `CLOUDFLARE_API_TOKEN` (GitHub secret or local env var).
- Authenticate the **Cloudflare Builds** MCP server in Cursor (Settings → MCP) for agent-side deploys via the Cloudflare plugin.
