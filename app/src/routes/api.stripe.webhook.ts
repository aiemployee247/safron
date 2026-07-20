import { createFileRoute } from '@tanstack/react-router'

import { bindings } from '../lib/bindings.server'
import { verifyStripeSignature } from '../lib/stripe.server'

// Stripe webhook: the ONLY thing that grants paid access. Stripe calls this
// after a real payment; we verify the signature, then flip the user's plan.
// Signed-in users can never self-upgrade once Stripe is configured.
export const Route = createFileRoute('/api/stripe/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { DB } = bindings()
        if (!DB) return new Response('no db', { status: 500 })

        const payload = await request.text()
        const sig = request.headers.get('stripe-signature')
        const ok = await verifyStripeSignature(payload, sig)
        if (!ok) return new Response('bad signature', { status: 400 })

        let event: any
        try {
          event = JSON.parse(payload)
        } catch {
          return new Response('bad json', { status: 400 })
        }
        const obj = event?.data?.object ?? {}

        try {
          if (event.type === 'checkout.session.completed') {
            // A subscription was just paid for. Grant access + store the ids.
            const userId = obj.client_reference_id as string | undefined
            const customer = obj.customer as string | undefined
            const subscription = obj.subscription as string | undefined
            if (userId) {
              await DB.prepare(
                "UPDATE users SET plan = 'all-access', stripe_customer_id = ?2, stripe_subscription_id = ?3 WHERE id = ?1",
              )
                .bind(userId, customer ?? null, subscription ?? null)
                .run()
            }
          } else if (
            event.type === 'customer.subscription.deleted' ||
            (event.type === 'customer.subscription.updated' &&
              ['canceled', 'unpaid', 'incomplete_expired'].includes(obj.status))
          ) {
            // Subscription ended or lapsed → revoke access, matched by customer.
            const customer = obj.customer as string | undefined
            if (customer) {
              await DB.prepare(
                "UPDATE users SET plan = 'free' WHERE stripe_customer_id = ?1",
              )
                .bind(customer)
                .run()
            }
          }
        } catch {
          // Never 500 on a handled event type; Stripe would retry forever.
          return new Response('handler error', { status: 200 })
        }

        return new Response('ok', { status: 200 })
      },
    },
  },
})
