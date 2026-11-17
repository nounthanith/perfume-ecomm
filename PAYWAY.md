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
- Stock is reserved when the pending order is created and released when a payment is cancelled/declined. An order abandoned mid-payment keeps its reservation until the customer cancels (or the cancel page is reached).
- The callback route accepts unsigned callbacks only when PayWay confirms the transaction through `check-transaction-2`; a valid callback HMAC is used as a fallback when that API is unavailable.
- The callback is idempotent: repeated notifications never double-apply stock changes or payment state.
- The RSA key pair is stored for future APIs (refunds/payouts); the Purchase API only needs the merchant ID and API key.
