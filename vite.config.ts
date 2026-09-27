import { readFileSync } from 'node:fs'
import { defineConfig, loadEnv } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { labs } from './src/data/labs.ts'

const shareImage = '/media/labs/standing-wave/poster.webp'

const escapeHtml = (value: string) => value.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]!)

// The hub owns exactly one page: `/`. Lab paths belong to the separate lab apps, and nothing else exists,
// so every other page request gets the real 404 page with a 404 status, locally as on the host.
function rootOnly(): Plugin {
  const notFound = (request: { url?: string; method?: string; headers: Record<string, string | string[] | undefined> }, response: { statusCode: number; setHeader: (name: string, value: string) => void; end: (body: string) => void }, next: () => void) => {
    const pathname = request.url?.split('?')[0] ?? '/'
    const accept = String(request.headers.accept ?? '')
    const isPage = (request.method === 'GET' || request.method === 'HEAD') && accept.includes('text/html')
    if (!isPage || pathname === '/' || pathname === '/index.html') return next()
    response.statusCode = 404
    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    response.end(readFileSync(new URL('./public/404.html', import.meta.url), 'utf8'))
  }
  return {
    name: 'hub-root-only',
    // Registered after Vite's static and HTML middleware, so real files still win.
    configureServer(server) { return () => { server.middlewares.use(notFound) } },
    configurePreviewServer(server) { return () => { server.middlewares.use(notFound) } },
  }
}

// Crawlers and no-JS visitors get the same honest index: only live labs are links.
function fallbackIndex() {
  const items = labs.map((lab) => {
    const title = lab.status === 'live' ? `<a href="${escapeHtml(lab.href)}" style="color:inherit">${escapeHtml(lab.title)}</a>` : escapeHtml(lab.title)
    const status = lab.status === 'live' ? 'Live.' : `Coming soon. ${escapeHtml(lab.href)} is not open yet.`
    return `<li style="margin:0 0 1.6rem"><h2 style="margin:0;font-size:1.6rem;letter-spacing:-.03em">${title}</h2><p style="margin:.3rem 0 0">${escapeHtml(lab.tagline)}</p><p style="margin:.3rem 0 0;color:#66625a;font:.85rem ui-monospace,Consolas,monospace">${status}</p></li>`
  }).join('')
  return `<main style="max-width:44rem;margin:0 auto;padding:3rem 1.25rem;color:#141310;background:#f0ebdf;font:1.1rem/1.55 system-ui,sans-serif">`
    + `<p style="margin:0;font:.85rem ui-monospace,Consolas,monospace;color:#66625a">Interactive Labs · Marinov</p>`
    + `<h1 style="margin:.8rem 0 .4rem;font-size:2.6rem;line-height:1;letter-spacing:-.05em">Playable 3D explainers.</h1>`
    + `<p style="margin:0 0 2.4rem">Each one makes a single misconception visible.</p>`
    + `<ol style="list-style:none;margin:0;padding:0">${items}</ol></main>`
}

export default defineConfig(({ mode }) => {
  const rawUrl = loadEnv(mode, process.cwd(), 'SITE_URL').SITE_URL?.trim()
  let siteUrl: string | undefined
  if (rawUrl) {
    const parsed = new URL(rawUrl)
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) {
      throw new Error('SITE_URL must be a full http(s) origin, for example https://your-domain.com/')
    }
    siteUrl = parsed.href
  }
  return {
    base: '/',
    // Not an SPA: no catch-all rewrites to index.html, so lab paths are never faked by the hub.
    appType: 'mpa',
    plugins: [
      react(),
      rootOnly(),
      {
        name: 'site-metadata',
        transformIndexHtml() {
          const schema = {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Interactive Labs',
            description: 'Playable 3D explainers. Each one makes a single misconception visible.',
            creator: { '@type': 'Person', name: 'Marinov' },
            ...(siteUrl ? { url: siteUrl } : {}),
            hasPart: labs.map((lab) => ({
              '@type': 'CreativeWork',
              name: lab.title,
              description: lab.tagline,
              ...(lab.status === 'live' && siteUrl ? { url: new URL(lab.href, siteUrl).href } : {}),
            })),
          }
          return [
            { tag: 'script', attrs: { type: 'application/ld+json' }, children: JSON.stringify(schema).replaceAll('<', '\\u003c'), injectTo: 'head' as const },
            { tag: 'noscript', children: fallbackIndex(), injectTo: 'body-prepend' as const },
            // Absolute URLs only exist when SITE_URL is set at build time. Without it, nothing claims a domain
            // and the card falls back to a plain summary instead of promising an image it cannot point to.
            { tag: 'meta', attrs: { name: 'twitter:card', content: siteUrl ? 'summary_large_image' : 'summary' }, injectTo: 'head' as const },
            ...(siteUrl ? [
              { tag: 'link', attrs: { rel: 'canonical', href: siteUrl }, injectTo: 'head' as const },
              { tag: 'meta', attrs: { property: 'og:url', content: siteUrl }, injectTo: 'head' as const },
              { tag: 'meta', attrs: { property: 'og:image', content: new URL(shareImage, siteUrl).href }, injectTo: 'head' as const },
              { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' }, injectTo: 'head' as const },
              { tag: 'meta', attrs: { property: 'og:image:height', content: '750' }, injectTo: 'head' as const },
              { tag: 'meta', attrs: { property: 'og:image:alt', content: 'The Standing Wave room experiment from Interactive Labs' }, injectTo: 'head' as const },
              { tag: 'meta', attrs: { name: 'twitter:image', content: new URL(shareImage, siteUrl).href }, injectTo: 'head' as const },
            ] : []),
          ]
        },
      },
    ],
  }
})
