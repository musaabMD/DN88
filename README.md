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

**Live URL:** https://dn88.pages.dev

### Option A — Deploy from your computer (fastest)

1. **Create a Cloudflare API token**
   - Open [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
   - Click **Create Token** → **Create Custom Token**
   - Permissions: **Account → Cloudflare Pages → Edit**
   - Account: your account (ID `5000e0a4f0ca6dd90b08bde9dc11ccb9`)
   - Create and copy the token (shown once)

2. **Run in your terminal** (from this repo folder):

```bash
export CLOUDFLARE_API_TOKEN=paste_your_token_here
export CLOUDFLARE_ACCOUNT_ID=5000e0a4f0ca6dd90b08bde9dc11ccb9
npm run deploy
```

3. Wait ~30 seconds, then open https://dn88.pages.dev/questions/sets/q1

**Tip:** Add the exports to `~/.zshrc` or `~/.bashrc` so you do not retype them, or use a `.env` file locally (never commit it):

```bash
# .env (local only — already gitignored)
CLOUDFLARE_API_TOKEN=your_token
CLOUDFLARE_ACCOUNT_ID=5000e0a4f0ca6dd90b08bde9dc11ccb9
export $(grep -v '^#' .env | xargs) && npm run deploy
```

### Option B — Auto-deploy on every push to `main`

Add these **GitHub repository secrets** ([Settings → Secrets → Actions](https://github.com/musaabMD/DN88/settings/secrets/actions)):

| Secret name | Value |
|-------------|-------|
| `CLOUDFLARE_API_TOKEN` | Your API token from step 1 above |
| `CLOUDFLARE_ACCOUNT_ID` | `5000e0a4f0ca6dd90b08bde9dc11ccb9` |

Push to `main` runs `.github/workflows/deploy-pages.yml`. If secrets are missing, the build still passes but deploy is skipped with a warning.

### Option C — Cloudflare Git integration (no GitHub Actions)

In the [Cloudflare dashboard](https://dash.cloudflare.com/?to=/:account/workers-and-pages), connect this repo to the **dn88** Pages project:

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Build output | `out` |
| Production branch | `main` |

Cloudflare builds and deploys on their servers when you push to `main`.
