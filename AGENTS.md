<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

DrNote is a **static, client-only Next.js 16 (React 19, Tailwind v4) front-end** with an optional **Cloudflare Worker API (DN88)** and **Clerk auth**.

- Commands: `npm run dev`, `npm run build`, `npm run lint`, `npm run deploy`, `npm run worker:dev`, `npm run worker:deploy`
- **Hosting:** Cloudflare Pages (`dn88.pages.dev`, custom domain `drnote.co`) — deploy with `npm run deploy`
- **Backend:** Cloudflare Worker **DN88** in `workers/dn88/`
- **Auth:** Clerk via `.env.local` (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`)
- Deploy needs `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` (`5000e0a4f0ca6dd90b08bde9dc11ccb9`) in the agent environment
- Authenticate the **Cloudflare Builds** MCP server in Cursor (Settings → MCP) for agent-side deploys
