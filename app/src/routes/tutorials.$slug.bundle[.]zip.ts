import { createFileRoute } from '@tanstack/react-router'

import { getSessionUserFromRequest } from '../lib/auth.server'
import { getTutorial } from '../lib/tutorials'
import { tutorialBlocks } from '../lib/tutorials-content.server'
import { makeZip } from '../lib/zip.server'
// The Mission Control dashboard template, imported as a raw string so it can
// go into the bundle as dashboard.html.
import dashboardTemplate from '../../public/pit-crew-starter/board-index.html.txt?raw'

// Members-only bundle: all prompts (.md) + the dashboard template (.html) + a
// README, zipped. Mirrors the on-page content — the gate makes it a perk.
export const Route = createFileRoute('/tutorials/$slug/bundle.zip')({
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
          return new Response(null, { status: 302, headers: { Location: `${origin}/sign-in` } })
        }

        const prompts = blocks.filter(
          (b): b is Extract<typeof b, { kind: 'prompt' }> => b.kind === 'prompt',
        )
        const promptsMd = [
          `# ${meta.title}`,
          '',
          `> ${meta.deck}`,
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

        const readme = [
          `# ${meta.title}`,
          '',
          meta.deck,
          '',
          '## In this bundle',
          '',
          `- prompts.md — all ${prompts.length} copy-paste prompts for this build`,
          ...(meta.dashboardTemplate ? ['- dashboard.html — the Mission Control dashboard template'] : []),
          '',
          '## License',
          '',
          'Use these prompts and the template in your own personal and commercial projects.',
          'Please do not resell, repackage, or republish the bundle itself — send people to',
          'https://agent-garage.higgsfield.app/tutorials/' + slug + ' instead.',
          '',
        ].join('\n')

        const files = [
          { name: 'README.md', text: readme },
          { name: 'prompts.md', text: promptsMd },
        ]
        if (meta.dashboardTemplate) {
          files.push({ name: 'dashboard.html', text: dashboardTemplate as string })
        }

        const zip = makeZip(files)
        return new Response(zip as unknown as BodyInit, {
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${slug}-bundle.zip"`,
            'Cache-Control': 'no-store',
          },
        })
      },
    },
  },
})
