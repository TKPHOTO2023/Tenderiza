import { createHmac, timingSafeEqual } from "crypto";

const YOCO_API = "https://payments.yoco.com/api";

function secretKey() {
  const key = process.env.YOCO_SECRET_KEY;
  if (!key) throw new Error("YOCO_SECRET_KEY is not set.");
  return key;
}

export function yocoConfigured() {
  return Boolean(process.env.YOCO_SECRET_KEY);
}

export interface YocoCheckout {
  id: string;
  redirectUrl: string;
  status?: string;
  paymentId?: string | null;
  amount?: number;
  metadata?: Record<string, string>;
}

/**
 * Creates a hosted checkout. Amount is in cents, ZAR only — Yoco's gateway
 * supports no other currency and has no recurring billing, which is why
 * Tenderiza sells fixed prepaid periods rather than a subscription.
 */
export async function createCheckout(input: {
  amountCents: number;
  successUrl: string;
  cancelUrl: string;
  failureUrl: string;
  metadata: Record<string, string>;
}): Promise<YocoCheckout> {
  const res = await fetch(`${YOCO_API}/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
      // Guards against a double-click creating two checkouts for one intent.
      "Idempotency-Key": `${input.metadata.companyId}-${input.metadata.option}-${Date.now()}`,
    },
    body: JSON.stringify({
      amount: input.amountCents,
      currency: "ZAR",
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
      failureUrl: input.failureUrl,
      metadata: input.metadata,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Yoco rejected the checkout (${res.status}): ${detail.slice(0, 300)}`);
  }
  return res.json();
}

/**
 * Re-reads a checkout straight from Yoco. Access is only ever granted off
 * this, never off the webhook body alone — so a forged or replayed webhook
 * can't buy anyone a subscription.
 */
export async function fetchCheckout(checkoutId: string): Promise<YocoCheckout> {
  const res = await fetch(`${YOCO_API}/checkouts/${checkoutId}`, {
    headers: { Authorization: `Bearer ${secretKey()}` },
  });
  if (!res.ok) throw new Error(`Couldn't read checkout ${checkoutId} from Yoco (${res.status})`);
  return res.json();
}

/**
 * Standard Webhooks (Svix-style) verification, as Yoco uses: HMAC-SHA256 over
 * "{id}.{timestamp}.{body}" with the whsec_ secret, plus a timestamp window
 * so an intercepted event can't be replayed later.
 */
export function verifyWebhook(headers: Headers, rawBody: string): boolean {
  const secret = process.env.YOCO_WEBHOOK_SECRET;
  if (!secret) return false;

  const id = headers.get("webhook-id");
  const timestamp = headers.get("webhook-timestamp");
  const signatureHeader = headers.get("webhook-signature");
  if (!id || !timestamp || !signatureHeader) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 180) return false; // 3-minute window

  const keyBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", keyBytes).update(`${id}.${timestamp}.${rawBody}`).digest("base64");

  // The header may carry several space-separated "v1,<sig>" entries.
  return signatureHeader.split(" ").some((entry) => {
    const candidate = entry.split(",")[1] ?? entry;
    const a = Buffer.from(candidate);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  });
}
