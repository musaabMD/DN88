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

Push to `main` triggers Cloudflare Pages deploy when GitHub secrets are configured, or run:

```bash
npm run build
npx wrangler pages deploy out --project-name=dn88
```
