# Stripe billing setup (DrNote)

DrNote billing runs through the **DN88 Cloudflare Worker** (`workers/dn88/`). The Next.js frontend calls Worker endpoints; Stripe webhooks update Clerk user plans and MedGenius credits.

## Architecture

```
Upgrade UI → POST /api/stripe/checkout → Stripe Checkout
Stripe webhook → POST /api/webhooks/stripe → Clerk metadata + D1 medgenius_users
Manage billing → POST /api/stripe/portal → Stripe Customer Portal
```

## 1. Create Stripe products & prices

In the [Stripe Dashboard](https://dashboard.stripe.com/products), create two subscription products:

| Product | Monthly price | Yearly price (20% off) |
|---------|---------------|------------------------|
| **Student** | $20 / month | $192 / year ($16/mo effective) |
| **Pro** | $30 / month | $288 / year ($24/mo effective) |

Copy each **Price ID** (`price_...`).

Legacy env vars `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_YEARLY` still work as fallbacks for Student pricing.

If a Price ID is missing, the Worker can still start Checkout with inline recurring price data that matches the table above. Configure real Stripe Price IDs for production anyway so the Dashboard catalog and Customer Portal plan-switching stay explicit.

## 2. Configure Worker secrets

Set these in `.env.local` (local) and GitHub Actions secrets (CI deploy):

```bash
STRIPE_SECRET_KEY=sk_live_...          # or sk_test_... for testing
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STUDENT_MONTHLY=price_...
STRIPE_PRICE_STUDENT_YEARLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
```

Minimum production setup for the Student monthly plan:

```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STUDENT_MONTHLY=price_... # $20/month
```

Push to production:

```bash
npm run worker:deploy
# or CI runs scripts/set-worker-secrets.sh automatically
```

## 3. Stripe webhook

Add a webhook endpoint in Stripe:

- **URL:** `https://api.drnote.co/api/webhooks/stripe`
- **Events:**
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

Copy the signing secret to `STRIPE_WEBHOOK_SECRET`.

## 4. Customer Portal (optional but recommended)

In Stripe Dashboard → **Settings → Billing → Customer portal**, enable:

- Cancel subscriptions
- Update payment method
- Switch plans (if you map prices in portal settings)

The Worker exposes `POST /api/stripe/portal` for signed-in users with an active subscription.

## 5. Test the flow

1. Sign in on `https://drnote.co`
2. Open `/upgrade/` and choose Student or Pro
3. Complete Stripe Checkout (use test card `4242 4242 4242 4242`)
4. Confirm redirect to `/upgrade/success/?plan=student|pro`
5. Verify Clerk user `publicMetadata.plan` updates to `student` or `pro`
6. Use **Manage billing** on the upgrade page to open the Customer Portal

## Plan mapping

Checkout attaches `clerkUserId` to Stripe session and subscription metadata. Webhooks resolve the user by:

1. `client_reference_id` (checkout completed)
2. `metadata.clerkUserId` (subscription events)
3. `stripe_customer_id` in `medgenius_users` (fallback)

Plans sync to Clerk (`publicMetadata.plan`) and D1 (`medgenius_users.plan`).
