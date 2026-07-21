// Server-only Stripe helpers, dependency-free (calls the REST API with fetch so
// it runs cleanly on the Workers runtime). Reads keys from server secrets.
import { bindings } from "./bindings.server";

const API = "https://api.stripe.com/v1";

export function stripeConfigured(): boolean {
  const env = bindings();
  return Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET && env.STRIPE_PRICE_ID);
}

function form(params: Record<string, string | undefined>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v != null) usp.set(k, v);
  return usp.toString();
}

async function stripePost(path: string, body: string): Promise<any> {
  const env = bindings();
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const json = await res.json();
  if (!res.ok) throw new Error((json as any)?.error?.message ?? "Stripe error");
  return json;
}

// Create a subscription Checkout Session for a $10/mo plan and return its URL.
export async function createCheckoutSession(
  user: { id: string; email: string; stripeCustomerId?: string | null },
  origin: string,
): Promise<string> {
  const env = bindings();
  const body = form({
    mode: "subscription",
    "line_items[0][price]": env.STRIPE_PRICE_ID,
    "line_items[0][quantity]": "1",
    client_reference_id: user.id,
    // Attach to an existing customer if we have one, else let Stripe make one
    // from the email so the receipt goes to the right place.
    customer: user.stripeCustomerId ?? undefined,
    customer_email: user.stripeCustomerId ? undefined : user.email,
    success_url: `${origin}/members?checkout=success`,
    cancel_url: `${origin}/members?checkout=cancelled`,
    allow_promotion_codes: "true",
  });
  const session = await stripePost("/checkout/sessions", body);
  return session.url as string;
}

// Create a Billing Portal session so a member can manage/cancel their plan.
export async function createBillingPortalSession(
  customerId: string,
  origin: string,
): Promise<string> {
  const body = form({ customer: customerId, return_url: `${origin}/members` });
  const session = await stripePost("/billing_portal/sessions", body);
  return session.url as string;
}

// Verify a Stripe webhook signature (HMAC-SHA256 over `${t}.${payload}`).
export async function verifyStripeSignature(
  payload: string,
  sigHeader: string | null,
): Promise<boolean> {
  const env = bindings();
  if (!sigHeader || !env.STRIPE_WEBHOOK_SECRET) return false;
  const parts = Object.fromEntries(
    sigHeader.split(",").map((kv) => kv.split("=") as [string, string]),
  );
  const t = parts["t"];
  const v1 = parts["v1"];
  if (!t || !v1) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(env.STRIPE_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(`${t}.${payload}`));
  const expected = Array.from(new Uint8Array(mac), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");

  // constant-time compare
  if (expected.length !== v1.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ v1.charCodeAt(i);
  return diff === 0;
}
