# DN88

Static site for DN88, deployed to Cloudflare.

## Live site (preview)

https://dn88.disco-mare.workers.dev

## Permanent hosting options

### Option A: One-click deploy (fastest)

Open this link, sign in to Cloudflare, and click **Deploy**:

https://deploy.workers.cloudflare.com/?url=https://github.com/musaabMD/DN88

Set build output directory to `public` (no build command needed).

### Option B: GitHub Actions (automated)

Add these repository secrets in GitHub (`Settings` → `Secrets and variables` → `Actions`):

- `CLOUDFLARE_API_TOKEN` — create at https://dash.cloudflare.com/profile/api-tokens with **Cloudflare Pages Edit** permission
- `CLOUDFLARE_ACCOUNT_ID` — from the Cloudflare dashboard URL

Push to `main` and the workflow deploys to `https://dn88.pages.dev`.

## Local preview

```bash
npx serve public
```

## Manual deploy

```bash
npx wrangler pages deploy public --project-name dn88
```
