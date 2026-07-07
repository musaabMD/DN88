# DN88

Static site for DN88, deployed to Cloudflare.

## Live site

https://dn88.disco-mare.workers.dev

## Local preview

Open `public/index.html` in a browser, or serve the folder locally:

```bash
npx serve public
```

## Deploy

```bash
npx wrangler deploy
```

For Cloudflare Pages (`*.pages.dev`), connect this repository in the [Cloudflare dashboard](https://dash.cloudflare.com/) and set the build output directory to `public`.
