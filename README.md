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

## Deploy

**Live site:** https://dn88.pages.dev

### Option A — GitHub Actions (needs one secret)

1. In GitHub → **Settings → Secrets and variables → Actions**, add:
   - `CLOUDFLARE_API_TOKEN` — [Create token](https://dash.cloudflare.com/profile/api-tokens) with **Account → Cloudflare Pages → Edit**
   - `CLOUDFLARE_ACCOUNT_ID` — `5000e0a4f0ca6dd90b08bde9dc11ccb9`
2. Push to `main` or re-run **Deploy to Cloudflare Pages** under Actions.

### Option B — Deploy from your machine or Cursor Cloud

```bash
export CLOUDFLARE_API_TOKEN=your_token_here
export CLOUDFLARE_ACCOUNT_ID=5000e0a4f0ca6dd90b08bde9dc11ccb9
npm run deploy
```

### Option C — Cloudflare Git integration (no GitHub secrets)

In [Cloudflare Dashboard → Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages), connect `musaabmd/dn88` with:

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Build output | `out` |
| Production branch | `main` |

Cloudflare will auto-deploy on every push.
