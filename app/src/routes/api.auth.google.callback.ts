import { createFileRoute } from '@tanstack/react-router'

import { createSessionSetCookie } from '../lib/auth.server'
import { bindings } from '../lib/bindings.server'

const STATE_COOKIE = 'ag_oauth_state'
const CLEAR_STATE = `${STATE_COOKIE}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`

function readStateCookie(request: Request): string | null {
  const raw = request.headers.get('Cookie') ?? ''
  for (const part of raw.split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name === STATE_COOKIE) return rest.join('=')
  }
  return null
}

function redirectWith(location: string, cookies: string[]): Response {
  const headers = new Headers({ Location: location })
  for (const c of cookies) headers.append('Set-Cookie', c)
  return new Response(null, { status: 302, headers })
}

// Finishes the Google OAuth flow: verifies state, exchanges the code for
// tokens, reads the Google profile, then signs the user in — creating an
// account on first use (matched to any existing account by email).
export const Route = createFileRoute('/api/auth/google/callback')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const env = bindings()
        const url = new URL(request.url)
        const origin = url.origin
        const fail = (reason: string) =>
          redirectWith(`${origin}/sign-in?error=${reason}`, [CLEAR_STATE])

        if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.DB) {
          return fail('google-unavailable')
        }
        const code = url.searchParams.get('code')
        const state = url.searchParams.get('state')
        const expectedState = readStateCookie(request)
        if (!code || !state || !expectedState || state !== expectedState) {
          return fail('google')
        }

        let profile: {
          email?: string
          email_verified?: boolean
          name?: string
        }
        try {
          const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              code,
              client_id: env.GOOGLE_CLIENT_ID,
              client_secret: env.GOOGLE_CLIENT_SECRET,
              redirect_uri: `${origin}/api/auth/google/callback`,
              grant_type: 'authorization_code',
            }),
          })
          if (!tokenRes.ok) return fail('google')
          const tokens = (await tokenRes.json()) as { access_token?: string }
          if (!tokens.access_token) return fail('google')

          const profileRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          })
          if (!profileRes.ok) return fail('google')
          profile = (await profileRes.json()) as typeof profile
        } catch {
          return fail('google')
        }

        const email = profile.email?.trim().toLowerCase()
        if (!email || profile.email_verified === false) return fail('google')

        const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?1')
          .bind(email)
          .first<{ id: string }>()
        let userId = existing?.id
        if (!userId) {
          userId = crypto.randomUUID()
          const name = profile.name?.trim() || email.split('@')[0]
          // Google-only accounts get a non-parseable password_hash sentinel, so
          // password sign-in can never match against them.
          await env.DB.prepare(
            "INSERT INTO users (id, email, name, password_hash, plan) VALUES (?1, ?2, ?3, 'google-oauth', 'free')",
          )
            .bind(userId, email, name)
            .run()
        }

        const sessionCookie = await createSessionSetCookie(userId)
        return redirectWith(`${origin}/members`, [CLEAR_STATE, sessionCookie])
      },
    },
  },
})
