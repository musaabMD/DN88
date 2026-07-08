# DrNote

A mobile-friendly medical study app with Duolingo-inspired design. Browse question sets, summaries, images, and flashcards across subjects.

**Live site:** https://dn88.pages.dev

## Features

- **Questions** — MCQ cards with explain, report, and comments sidebar
- **Summary** — Expandable bullet-point notes
- **Images** — Visual study cards with likes and bookmarks
- **Flashcards** — Flip cards with Again/Hard/Good/Easy ratings
- **Filters** — Subject, status, and tag filtering
- **Stats** — Streak, league rank, and daily limit tracking
- **Upgrade** — Pro plan modal

## Stack

- Next.js 16 (App Router, static export)
- TypeScript
- Tailwind CSS v4
- lucide-react

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Cloudflare Pages

The site is hosted on **Cloudflare Pages** (`dn88.pages.dev`), not GitHub.

### Direct deploy (recommended)

Build and upload straight to Cloudflare with Wrangler:

```bash
export CLOUDFLARE_API_TOKEN=your_token_here
export CLOUDFLARE_ACCOUNT_ID=5000e0a4f0ca6dd90b08bde9dc11ccb9
npm run deploy
```

Create an API token at [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) with **Account → Cloudflare Pages → Edit**.

### Auto-deploy from Git (optional)

If you want Cloudflare to build on every push, connect the repo in the [Cloudflare dashboard](https://dash.cloudflare.com/?to=/:account/workers-and-pages) — Cloudflare pulls from Git and deploys on their servers (no GitHub Actions needed):

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Build output | `out` |
| Production branch | `main` |
