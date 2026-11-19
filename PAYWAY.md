# ABA PayWay sandbox integration

Customer checkout flow: cart → `/checkout` → hosted PayWay checkout → `/checkout/success` (or `/checkout/cancel`).

## Configuration

Credentials live in `.env.local` (git-ignored). For a different environment set:

```env
PAYWAY_MERCHANT_ID=ec480658
PAYWAY_API_KEY=<the "Public Key" issued by ABA — used as the HMAC secret>
PAYWAY_BASE_URL=https://checkout-sandbox.payway.com.kh
PAYWAY_API_KEY_EXPIRES_AT=2026-12-17
NEXT_PUBLIC_BASE_URL=https://your-public-domain.com
PAYWAY_RSA_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----\n"
PAYWAY_RSA_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n"
```

For production, change `PAYWAY_BASE_URL` to `https://checkout.payway.com.kh` and use the production merchant credentials.

### Deploying to Vercel

`.env.local` and `.env.production` are git-ignored, so Vercel does **not** upload them. Add the same values in your Vercel project: **Settings → Environment Variables → Add New**, select **Production** (and Preview/Development if you use them), then **Save** and **Redeploy**. Copy the values from your local `.env.production`; do not commit the env files.

At minimum add:

```env
PAYWAY_MERCHANT_ID=ec480658
PAYWAY_API_KEY=<Public Key issued by ABA>
PAYWAY_BASE_URL=https://checkout-sandbox.payway.com.kh
PAYWAY_API_KEY_EXPIRES_AT=2026-12-17
NEXT_PUBLIC_BASE_URL=https://your-deployed-domain.vercel.app
```

`NEXT_PUBLIC_BASE_URL` is inlined at build time, so a full redeploy is required after changing it. The RSA keys are optional for the Purchase API. ABA must also whitelist the deployed domain before hosted checkout/callbacks will work.

> If these are missing, checkout fails with: `ABA PayWay is not configured. Set PAYWAY_MERCHANT_ID and PAYWAY_API_KEY.`

> The current sandbox key is valid until **17 December 2026** (merchant `ec480658`). The previous key expired on 14 November 2026 and PayWay answered HTTP 403 with `{"status":{"code":21,"message":"End of API lifetime."}}`. The checkout page detects an expired key and shows a friendly error instead of that raw JSON. When this key expires, request a fresh one from ABA and update `PAYWAY_API_KEY`, `PAYWAY_MERCHANT_ID` and `PAYWAY_API_KEY_EXPIRES_AT`. The RSA keys are not used by the Purchase API.

`NEXT_PUBLIC_BASE_URL` must be a **publicly reachable** URL for the callback (`return_url`) to work. `localhost` is fine for testing the redirect and status polling, but PayWay's servers cannot call a local callback. The success page polls `/api/payments/payway/check-transaction-2` through our own status endpoint, so payment confirmation still works locally. ABA must also whitelist the domain used for checkout and callbacks.

## Files

| Path | Purpose |
| --- | --- |
| `src/lib/payway.ts` | Hash generation, signed purchase form, callback signature check, `check-transaction-2` client |
| `src/lib/payway-order.ts` | Idempotent order state transitions and stock release |
| `src/app/api/payments/payway/create/route.ts` | Validates cart, reserves stock, creates a pending order, returns the signed PayWay form |
| `src/app/api/payments/payway/callback/route.ts` | Public `return_url`; verifies signature and reconciles status with PayWay |
| `src/app/api/payments/payway/status/route.ts` | Pollable order status; reconciles pending orders |
| `src/app/api/payments/payway/cancel/route.ts` | Cancels an abandoned payment and releases stock |
| `src/app/api/payments/payway/release-stale/route.ts` | Admin/cron cleanup of expired pending reservations |
| `src/app/(site)/checkout/**` | Checkout, success and cancel pages |

## Sandbox test cards

| Card | Number | Expiry | CVV |
| --- | --- | --- | --- |
| Mastercard (success) | 5156 8399 3770 6777 | 01/30 | 993 |
| Visa (success, 3DS) | 4286 0900 0000 0206 | 04/30 | 777 |
| Mastercard (decline) | 5156 8302 7256 1029 | 04/30 | 777 |

3DS OTP is sent to the sandbox account email registered with ABA.

## Notes / limitations

- Prices remain in USD; the cart and PayWay both use USD, with no conversion.
- Stock is reserved when the pending order is created and released when a payment is cancelled/declined. An order abandoned mid-payment keeps its reservation for 30 minutes; it is then released automatically on the next checkout or by calling `POST /api/payments/payway/release-stale` (admin session, or `Authorization: Bearer $CRON_SECRET`).
- The callback route accepts unsigned callbacks only when PayWay confirms the transaction through `check-transaction-2`; a valid callback HMAC is used as a fallback when that API is unavailable.
- The callback is idempotent: repeated notifications never double-apply stock changes or payment state. Order transitions are claimed atomically, so concurrent cancel/callback requests cannot restore the same stock twice.
- Stale-reservation cleanup only releases when PayWay confirms the transaction is still pending (or does not exist). If the check API is unreachable, the reservation is left intact rather than risking cancellation of a real payment.
- Only orders with status `paid` count toward sales reports. Pending, failed and cancelled PayWay orders remain visible in Sell Management (with their status) but do not inflate revenue/order counts.
- A callback payload is used as a fallback only when PayWay's `check-transaction-2` API cannot be reached. If PayWay answers `PENDING` or `PRE-AUTH`, the order stays pending — a callback can never promote an unpaid order to paid.
- `PRE-AUTH` is not treated as a completed payment. Only `APPROVED` with a matching USD amount confirms an order; declined/cancelled/refunded statuses release the reserved stock.
- The RSA key pair is stored for future APIs (refunds/payouts); the Purchase API only needs the merchant ID and API key.
