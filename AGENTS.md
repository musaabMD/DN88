<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

DrNote is a **static, client-only Next.js 16 (React 19, Tailwind v4) front-end**. There is no backend, database, auth, or external API — all study content and the "AI tutor" chat are hardcoded/mocked in `src/components/DrNoteApp.tsx`. No environment variables or secrets are needed to run, build, or test locally.

- Dev/build/lint commands live in `package.json` (`npm run dev`, `npm run build`, `npm run lint`). Dev server serves at `http://localhost:3000`.
- The update script already runs `npm ci`, so dependencies are installed when a session starts.
- `npm run lint` currently reports pre-existing errors in `src/components/DrNoteApp.tsx` (React 19 `react-hooks` rules: set-state-in-effect, refs/purity during render). These are not caused by env setup — a non-zero lint exit is expected on unmodified code.
- The Cloudflare/Wrangler config and the `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` secrets are for production Pages deploy only (see `README.md`); they are not needed for local dev/test.
