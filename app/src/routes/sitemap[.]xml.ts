import { createFileRoute } from '@tanstack/react-router'

import { tutorials } from '../lib/tutorials'

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin
        const today = new Date().toISOString().split('T')[0]
        const paths = [
          '/',
          '/tutorials',
          ...tutorials.map((t) => `/tutorials/${t.slug}`),
          '/services',
          '/contact',
          '/sign-in',
          '/sign-up',
        ]
        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...paths.map((p) =>
            [
              '  <url>',
              `    <loc>${origin}${p}</loc>`,
              `    <lastmod>${today}</lastmod>`,
              '    <changefreq>weekly</changefreq>',
              `    <priority>${p === '/' ? '1.0' : '0.7'}</priority>`,
              '  </url>',
            ].join('\n'),
          ),
          '</urlset>',
        ].join('\n')
        return new Response(xml, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          },
        })
      },
    },
  },
})
