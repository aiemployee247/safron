import { createFileRoute } from '@tanstack/react-router'

import { bindings } from '../lib/bindings.server'

const STATE_COOKIE = 'ag_oauth_state'

// Kicks off the Google OAuth flow: sets a short-lived state cookie and
// redirects to Google's consent screen. The callback route finishes the flow.
export const Route = createFileRoute('/api/auth/google')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const env = bindings()
        const origin = new URL(request.url).origin
        if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
          return new Response(null, {
            status: 302,
            headers: { Location: `${origin}/sign-in?error=google-unavailable` },
          })
        }
        const state = crypto.randomUUID()
        const params = new URLSearchParams({
          client_id: env.GOOGLE_CLIENT_ID,
          redirect_uri: `${origin}/api/auth/google/callback`,
          response_type: 'code',
          scope: 'openid email profile',
          state,
          prompt: 'select_account',
        })
        const headers = new Headers({
          Location: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
        })
        headers.append(
          'Set-Cookie',
          `${STATE_COOKIE}=${state}; Max-Age=600; Path=/; HttpOnly; Secure; SameSite=Lax`,
        )
        return new Response(null, { status: 302, headers })
      },
    },
  },
})
