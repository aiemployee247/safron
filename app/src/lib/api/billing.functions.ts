import { createServerFn } from "@tanstack/react-start";

import { bindings } from "../bindings.server";
import { getSessionUser } from "../auth.server";
import {
  createBillingPortalSession,
  createCheckoutSession,
  stripeConfigured,
} from "../stripe.server";

// Canonical site origin for Stripe redirect URLs (checkout success/cancel and
// the billing-portal return). The members area lives on this host.
const SITE_ORIGIN = "https://agent-garage.higgsfield.app";

// Whether real paid checkout is wired (Stripe secrets present). The members
// area uses this to decide between Stripe checkout and the free beta unlock.
export const billingEnabled = createServerFn({ method: "GET" }).handler(async () => {
  return stripeConfigured();
});

// Start a Stripe Checkout for the $10/mo plan; returns the redirect URL.
export const startCheckout = createServerFn({ method: "POST" }).handler(async () => {
  const user = await getSessionUser();
  const { DB } = bindings();
  if (!user || !DB) return { ok: false as const, error: "Sign in first." };
  if (!stripeConfigured()) return { ok: false as const, error: "Checkout isn't available yet." };

  const row = await DB.prepare("SELECT stripe_customer_id FROM users WHERE id = ?1")
    .bind(user.id)
    .first<{ stripe_customer_id: string | null }>();

  const origin = SITE_ORIGIN;
  try {
    const url = await createCheckoutSession(
      { id: user.id, email: user.email, stripeCustomerId: row?.stripe_customer_id ?? null },
      origin,
    );
    return { ok: true as const, url };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Checkout failed." };
  }
});

// Open the Stripe Billing Portal so a member can manage or cancel.
export const openBillingPortal = createServerFn({ method: "POST" }).handler(async () => {
  const user = await getSessionUser();
  const { DB } = bindings();
  if (!user || !DB) return { ok: false as const, error: "Sign in first." };

  const row = await DB.prepare("SELECT stripe_customer_id FROM users WHERE id = ?1")
    .bind(user.id)
    .first<{ stripe_customer_id: string | null }>();
  if (!row?.stripe_customer_id) return { ok: false as const, error: "No subscription found." };

  const origin = SITE_ORIGIN;
  try {
    const url = await createBillingPortalSession(row.stripe_customer_id, origin);
    return { ok: true as const, url };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Could not open portal." };
  }
});
