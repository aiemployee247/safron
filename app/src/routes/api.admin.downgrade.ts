import { createFileRoute } from '@tanstack/react-router'

import { bindings } from '../lib/bindings.server'

// TEMPORARY, downgrade-only admin endpoint. It can ONLY set a plan to 'free'
// (never grant access), and only with the secret token. Used once to reset a
// test account, then removed. Low blast radius by design.
export const Route = createFileRoute('/api/admin/downgrade')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { DB, ADMIN_DOWNGRADE_TOKEN } = bindings()
        const url = new URL(request.url)
        const token = url.searchParams.get('token')
        const email = (url.searchParams.get('email') ?? '').trim().toLowerCase()

        if (!DB || !ADMIN_DOWNGRADE_TOKEN) return new Response('unavailable', { status: 503 })
        if (!token || token !== ADMIN_DOWNGRADE_TOKEN) return new Response('forbidden', { status: 403 })
        if (!email) return new Response('email required', { status: 400 })

        const res = await DB.prepare("UPDATE users SET plan = 'free' WHERE email = ?1")
          .bind(email)
          .run()
        const changed = (res as { meta?: { changes?: number } }).meta?.changes ?? 0
        return new Response(JSON.stringify({ ok: true, email, downgraded: changed }), {
          headers: { 'Content-Type': 'application/json' },
        })
      },
    },
  },
})
