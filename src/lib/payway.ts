import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

/**
 * ABA PayWay server helpers.
 *
 * All PayWay requests are signed with HMAC-SHA512 over a concatenation of
 * fields in a very specific order (the "public key" they issue is the HMAC
 * secret). The order below is the one documented for the Purchase API.
 */

export const PAYWAY_PURCHASE_PATH =
  "/api/payment-gateway/v1/payments/purchase";
export const PAYWAY_CHECK_PATH =
  "/api/payment-gateway/v1/payments/check-transaction-2";
export const PAYWAY_CURRENCY = "USD";

export class PaywayConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaywayConfigError";
  }
}

const HASH_FIELDS = [
  "req_time",
  "merchant_id",
  "tran_id",
  "amount",
  "items",
  "shipping",
  "firstname",
  "lastname",
  "email",
  "phone",
  "type",
  "payment_option",
  "return_url",
  "cancel_url",
  "continue_success_url",
  "return_deeplink",
  "currency",
  "custom_fields",
  "return_params",
  "payout",
  "lifetime",
  "additional_params",
  "google_pay_token",
  "skip_success_page",
] as const;

type HashValues = Record<(typeof HASH_FIELDS)[number], string>;

interface PaywayConfig {
  merchantId: string;
  apiKey: string;
  baseUrl: string;
  appUrl: string;
}

export interface PurchaseItem {
  name: string;
  quantity: number;
  price: number;
}

export interface PurchaseRequestInput {
  tranId: string;
  orderNumber: string;
  amount: number;
  items: PurchaseItem[];
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
}

export interface PurchaseRequest {
  action: string;
  fields: Record<string, string>;
  tranId: string;
  reqTime: string;
}

export interface PaywayTransactionStatus {
  ok: boolean;
  approved: boolean;
  paymentStatus: string;
  paymentStatusCode: number | null;
  amount: number | null;
  currency: string;
  apv: string;
  bankRef: string;
  paymentType: string;
  code: string | number | null;
  message: string;
}

function getConfig(): PaywayConfig {
  const merchantId = process.env.PAYWAY_MERCHANT_ID;
  const apiKey = process.env.PAYWAY_API_KEY;

  if (!merchantId || !apiKey) {
    throw new PaywayConfigError(
      "ABA PayWay is not configured. Set PAYWAY_MERCHANT_ID and PAYWAY_API_KEY."
    );
  }

  // Sandbox API keys carry a validity date. Block expired keys here so the
  // customer sees a helpful message instead of PayWay's raw JSON error page.
  const expiresAt = process.env.PAYWAY_API_KEY_EXPIRES_AT;
  if (expiresAt) {
    const expiry = new Date(`${expiresAt}T23:59:59Z`);
    if (!Number.isNaN(expiry.getTime()) && expiry.getTime() < Date.now()) {
      throw new PaywayConfigError(
        `The ABA PayWay API key expired on ${expiresAt}. Please ask ABA for a new key, then update PAYWAY_API_KEY and PAYWAY_API_KEY_EXPIRES_AT in .env.local.`
      );
    }
  }

  return {
    merchantId,
    apiKey,
    baseUrl: (
      process.env.PAYWAY_BASE_URL ?? "https://checkout-sandbox.payway.com.kh"
    ).replace(/\/$/, ""),
    appUrl: (process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000").replace(
      /\/$/,
      ""
    ),
  };
}

/** UTC timestamp in the YYYYMMDDHHmmss format PayWay expects. */
function utcStamp(date = new Date()): string {
  return date.toISOString().replace(/[-:T]/g, "").slice(0, 14);
}

/** Short, unique, URL-safe transaction id (max 20 chars as required by PayWay). */
export function generateTranId(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i += 1) {
    suffix += alphabet[randomInt(alphabet.length)];
  }
  return `PW${Date.now().toString(36)}${suffix}`;
}

function toBase64(value: string): string {
  return Buffer.from(value, "utf8").toString("base64");
}

function encodeItems(items: PurchaseItem[]): string {
  return toBase64(
    JSON.stringify(
      items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      }))
    )
  );
}

function sign(values: Partial<HashValues>, apiKey: string): string {
  const data = HASH_FIELDS.map((field) => values[field] ?? "").join("");
  return createHmac("sha512", apiKey).update(data, "utf8").digest("base64");
}

/** PayWay only accepts latin names for card payments. */
function splitName(fullName: string): { firstname: string; lastname: string } {
  const cleaned = fullName
    .replace(/[^a-zA-Z\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
  const parts = cleaned.split(" ");
  return {
    firstname: parts[0] || "Customer",
    lastname: parts.slice(1).join(" ") || "Customer",
  };
}

/**
 * Builds the signed hidden form that the browser posts directly to PayWay.
 * Using a browser form POST lets PayWay's hosted checkout render in the
 * browser and redirect back to `continue_success_url` afterwards.
 */
export function createPurchaseRequest(input: PurchaseRequestInput): PurchaseRequest {
  const { merchantId, apiKey, baseUrl, appUrl } = getConfig();
  const reqTime = utcStamp();
  const { firstname, lastname } = splitName(input.customerName);

  // The callback URL must be base64 encoded; the redirect URLs are plain.
  const returnUrl = toBase64(`${appUrl}/api/payments/payway/callback`);
  const cancelUrl = `${appUrl}/checkout/cancel?order=${encodeURIComponent(
    input.orderNumber
  )}&tran=${encodeURIComponent(input.tranId)}`;
  const continueSuccessUrl = `${appUrl}/checkout/success?order=${encodeURIComponent(
    input.orderNumber
  )}&tran=${encodeURIComponent(input.tranId)}`;

  const values: HashValues = {
    req_time: reqTime,
    merchant_id: merchantId,
    tran_id: input.tranId,
    amount: input.amount.toFixed(2),
    items: encodeItems(input.items),
    shipping: "",
    firstname,
    lastname,
    email: input.customerEmail ?? "",
    phone: input.customerPhone,
    type: "purchase",
    payment_option: "",
    return_url: returnUrl,
    cancel_url: cancelUrl,
    continue_success_url: continueSuccessUrl,
    return_deeplink: "",
    currency: PAYWAY_CURRENCY,
    custom_fields: toBase64(JSON.stringify({ orderNumber: input.orderNumber })),
    return_params: input.orderNumber,
    payout: "",
    lifetime: "30",
    additional_params: "",
    google_pay_token: "",
    skip_success_page: "1",
  };

  const hash = sign(values, apiKey);

  // Empty optional fields are deliberately omitted from the form (PayWay
  // treats them as empty in the hash either way, but sending them explicitly
  // has caused "Wrong hash" errors on some merchant profiles).
  const fields: Record<string, string> = {
    req_time: values.req_time,
    merchant_id: values.merchant_id,
    tran_id: values.tran_id,
    amount: values.amount,
    items: values.items,
    firstname: values.firstname,
    lastname: values.lastname,
    phone: values.phone,
    currency: values.currency,
    custom_fields: values.custom_fields,
    return_params: values.return_params,
    return_url: values.return_url,
    cancel_url: values.cancel_url,
    continue_success_url: values.continue_success_url,
    type: values.type,
    lifetime: values.lifetime,
    skip_success_page: values.skip_success_page,
    // Not part of the hash:
    view_type: "hosted_view",
    payment_gate: "0",
    hash,
  };

  if (values.email) fields.email = values.email;

  return {
    action: `${baseUrl}${PAYWAY_PURCHASE_PATH}`,
    fields,
    tranId: input.tranId,
    reqTime,
  };
}

/** Verifies the X-Payway-Hmac-Sha512 header on a callback. */
export function verifyCallbackSignature(
  payload: unknown,
  signature: string
): boolean {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return false;
  }

  let apiKey: string;
  try {
    ({ apiKey } = getConfig());
  } catch {
    return false;
  }

  const values = Object.keys(payload as Record<string, unknown>)
    .sort()
    .map((key) => {
      const value = (payload as Record<string, unknown>)[key];
      if (value === undefined || value === null) return "";
      return typeof value === "object" ? JSON.stringify(value) : String(value);
    });
  const expected = createHmac("sha512", apiKey)
    .update(values.join(""), "utf8")
    .digest("base64");

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Authoritative payment status. The callback is only a hint — this API is
 * the source of truth and also covers local dev, where PayWay cannot reach a
 * localhost callback URL.
 */
export async function checkTransaction(
  tranId: string
): Promise<PaywayTransactionStatus> {
  const fallback: PaywayTransactionStatus = {
    ok: false,
    approved: false,
    paymentStatus: "UNKNOWN",
    paymentStatusCode: null,
    amount: null,
    currency: "",
    apv: "",
    bankRef: "",
    paymentType: "",
    code: null,
    message: "Unable to check transaction",
  };

  let config: PaywayConfig;
  try {
    config = getConfig();
  } catch (error) {
    console.error("PayWay configuration error:", error);
    return fallback;
  }

  const { merchantId, apiKey, baseUrl } = config;
  const reqTime = utcStamp();
  const hash = createHmac("sha512", apiKey)
    .update(`${reqTime}${merchantId}${tranId}`, "utf8")
    .digest("base64");

  try {
    const response = await fetch(`${baseUrl}${PAYWAY_CHECK_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ req_time: reqTime, merchant_id: merchantId, tran_id: tranId, hash }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const json = (await response.json().catch(() => null)) as {
      status?: { code?: string | number; message?: string };
      data?: {
        payment_status_code?: number;
        payment_status?: string;
        payment_amount?: number | string;
        total_amount?: number | string;
        payment_currency?: string;
        apv?: string;
        bank_ref?: string;
        payment_type?: string;
      };
    } | null;

    if (!json) return fallback;

    const code = json.status?.code ?? null;
    const ok = code === "00" || code === 0;
    const data = json.data;

    return {
      ok,
      approved: Boolean(
        data &&
          (data.payment_status?.toUpperCase() === "APPROVED" ||
            (data.payment_status_code === 0 && !data.payment_status))
      ),
      paymentStatus: data?.payment_status ?? "UNKNOWN",
      paymentStatusCode: data?.payment_status_code ?? null,
      amount: data
        ? Number(data.payment_amount ?? data.total_amount ?? 0)
        : null,
      currency: data?.payment_currency ?? "",
      apv: data?.apv ?? "",
      bankRef: data?.bank_ref ?? "",
      paymentType: data?.payment_type ?? "",
      code,
      message: json.status?.message ?? "",
    };
  } catch (error) {
    console.error("PayWay check-transaction failed:", error);
    return fallback;
  }
}
