# DrNote

A mobile-friendly study app built with Next.js. Pick an exam, browse sets, and study with Learn, MCQs, and Review tabs.

**Live site:** https://dn88.pages.dev

## Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- lucide-react

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pages

- **/** — Pick an exam, then browse and filter study sets
- **/exam/[examId]/set/[setId]** — Set detail with Learn, MCQs, and Review tabs
- **/add** — Create and manage your own sets

## Deploy to Cloudflare Pages

Push to `main` triggers the GitHub Actions workflow when these secrets are set:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Manual deploy:

```bash
npm run build
npx wrangler pages deploy out --project-name=dn88
```
