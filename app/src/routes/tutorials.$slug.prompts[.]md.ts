import { createFileRoute } from '@tanstack/react-router'

import { getSessionUserFromRequest } from '../lib/auth.server'
import { getTutorial } from '../lib/tutorials'
import { tutorialBlocks } from '../lib/tutorials-content.server'

// Members-only download: every prompt card in a tutorial, assembled into one
// markdown file. Mirrors the on-page content — nothing extra is exposed here;
// the gate exists so downloads are a membership perk.
export const Route = createFileRoute('/tutorials/$slug/prompts.md')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const slug = params.slug
        const meta = getTutorial(slug)
        const blocks = tutorialBlocks[slug]
        if (!meta || !blocks) return new Response('Not found', { status: 404 })

        const user = await getSessionUserFromRequest(request)
        if (user?.plan !== 'all-access') {
          const origin = new URL(request.url).origin
          return new Response(null, {
            status: 302,
            headers: { Location: `${origin}/sign-in` },
          })
        }

        const prompts = blocks.filter(
          (b): b is Extract<typeof b, { kind: 'prompt' }> => b.kind === 'prompt',
        )
        const md = [
          `# ${meta.title}`,
          '',
          `> ${meta.deck}`,
          '',
          `Prompt pack from Agent Garage (https://agent-garage.higgsfield.app/tutorials/${slug}).`,
          'For your own personal and commercial projects. Please don’t redistribute the pack itself.',
          '',
          ...prompts.flatMap((p) => [
            `## Prompt ${p.num} — ${p.title}`,
            '',
            '```text',
            p.text,
            '```',
            '',
          ]),
        ].join('\n')

        return new Response(md, {
          headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Content-Disposition': `attachment; filename="${slug}-prompts.md"`,
            'Cache-Control': 'no-store',
          },
        })
      },
    },
  },
})
