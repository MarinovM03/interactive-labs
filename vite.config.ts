import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig, loadEnv } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { labs } from './src/data/labs.ts'

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url))
const shareImage = { path: '/media/share.jpg', width: '1200', height: '630', alt: 'Interactive Labs by Marinov: playable 3D explainers, with stills from Standing Wave and The Coin Table.' }

const escapeHtml = (value: string) => value.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]!)

function productionHeaders() {
  const headers: Record<string, string> = {}
  let inBlock = false
  for (const line of readFileSync(fromRoot('./public/_headers'), 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue
    if (!/^\s/.test(line)) { inBlock = line.trim() === '/*'; continue }
    const colon = line.indexOf(':')
    if (inBlock && colon > 0) headers[line.slice(0, colon).trim()] = line.slice(colon + 1).trim()
  }
  return headers
}

const wantsMissingPage = (request: IncomingMessage) => {
  const pathname = request.url?.split('?')[0] ?? '/'
  const isPage = (request.method === 'GET' || request.method === 'HEAD') && String(request.headers.accept ?? '').includes('text/html')
  return isPage && pathname !== '/' && pathname !== '/index.html'
}

const sendMissingPage = (response: ServerResponse, html: string, headers: Record<string, string>) => {
  response.statusCode = 404
  for (const [name, value] of Object.entries({ ...headers, 'Content-Type': 'text/html; charset=utf-8' })) response.setHeader(name, value)
  response.end(html)
}

// The hub serves only `/`. Lab paths belong to separate apps, so any other page request gets the real 404, as on the host.
function rootOnly(): Plugin {
  return {
    name: 'hub-root-only',
    // Returning a function registers these after Vite's static middleware, so real files still win.
    configureServer(server) {
      return () => {
        server.middlewares.use((request, response, next) => {
          if (!wantsMissingPage(request)) return next()
          server.transformIndexHtml('/404.html', readFileSync(fromRoot('./404.html'), 'utf8'))
            .then((html) => sendMissingPage(response, html, {}), next)
        })
      }
    },
    configurePreviewServer(server) {
      const page = resolve(server.config.root, server.config.build.outDir, '404.html')
      const headers = productionHeaders()
      return () => {
        server.middlewares.use((request, response, next) => {
          if (!wantsMissingPage(request)) return next()
          sendMissingPage(response, readFileSync(page, 'utf8'), headers)
        })
      }
    },
  }
}

function checkLabs() {
  const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  const reservedIds = new Set(['index', 'index-label'])
  const problems: string[] = []
  const seen = { ids: new Set<string>(), hrefs: new Set<string>() }
  for (const [position, lab] of labs.entries()) {
    const at = `labs[${position}] (${lab.id || 'no id'})`
    if (!slug.test(lab.id) || reservedIds.has(lab.id)) problems.push(`${at}: id must be lowercase-with-dashes and not ${[...reservedIds].join(' or ')}`)
    if (seen.ids.has(lab.id)) problems.push(`${at}: duplicate id`)
    if (!/^\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/.test(lab.href)) problems.push(`${at}: href must look like /lab-name/`)
    if (seen.hrefs.has(lab.href)) problems.push(`${at}: duplicate href`)
    seen.ids.add(lab.id)
    seen.hrefs.add(lab.href)
    for (const field of ['title', 'tagline', 'assumption', 'reveal', 'category'] as const) if (!lab[field].trim()) problems.push(`${at}: ${field} is empty`)
    if (!lab.media.alt.trim()) problems.push(`${at}: media.alt is empty`)
    if (!/^#[0-9a-f]{6}$/i.test(lab.swatch)) problems.push(`${at}: swatch must be a #rrggbb colour`)
    for (const file of [lab.media.poster, lab.media.loop?.mp4, lab.media.loop?.webm]) {
      if (file && !(file.startsWith(`/media/labs/${lab.id}/`) && existsSync(fromRoot(`./public${file}`)))) problems.push(`${at}: ${file} must exist under public/media/labs/${lab.id}/`)
    }
  }
  if (problems.length) throw new Error(`src/data/labs.ts has problems:\n- ${problems.join('\n- ')}`)
}

function fallbackIndex() {
  const items = labs.map((lab) => {
    const title = lab.status === 'live' ? `<a href="${escapeHtml(lab.href)}" style="color:inherit">${escapeHtml(lab.title)}</a>` : escapeHtml(lab.title)
    const status = lab.status === 'live' ? 'Live.' : `Coming soon. ${escapeHtml(lab.href)} is not open yet.`
    return `<li style="margin:0 0 1.6rem"><h2 style="margin:0;font-size:1.6rem;letter-spacing:-.03em">${title}</h2><p style="margin:.3rem 0 0">${escapeHtml(lab.tagline)}</p><p style="margin:.3rem 0 0;color:#66625a;font:.85rem ui-monospace,Consolas,monospace">${status}</p></li>`
  }).join('')
  return `<main style="max-width:44rem;margin:0 auto;padding:3rem 1.25rem;color:#141310;background:#f0ebdf;font:1.1rem/1.55 system-ui,sans-serif">`
    + `<p style="margin:0;font:.85rem ui-monospace,Consolas,monospace;color:#66625a">Interactive Labs by Marinov</p>`
    + `<h1 style="margin:.8rem 0 .4rem;font-size:2.6rem;line-height:1;letter-spacing:-.05em">Playable 3D explainers.</h1>`
    + `<p style="margin:0 0 2.4rem">Each one makes a single misconception visible.</p>`
    + `<ol style="list-style:none;margin:0;padding:0">${items}</ol></main>`
}

export default defineConfig(({ command, mode }) => {
  checkLabs()
  const rawUrl = loadEnv(mode, process.cwd(), 'SITE_URL').SITE_URL?.trim()
  let siteUrl: string | undefined
  if (rawUrl) {
    const parsed = new URL(rawUrl)
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) {
      throw new Error('SITE_URL must be a full http(s) origin, for example https://your-domain.com/')
    }
    siteUrl = parsed.href
  }
  if (command === 'build' && !siteUrl && process.env.CF_PAGES === '1' && process.env.CF_PAGES_BRANCH === 'main') {
    console.warn('\nSITE_URL is not set for this production build, so the page ships without a canonical URL or share image.\n')
  }
  const liveUrls = siteUrl ? [siteUrl, ...labs.filter((lab) => lab.status === 'live').map((lab) => new URL(lab.href, siteUrl).href)] : []
  return {
    base: '/',
    appType: 'mpa',
    server: {
      // Vite answers extensionless dotfiles like `.gitignore` with a 500 that includes local paths.
      fs: { deny: ['.*', '*.{crt,pem}', '**/.git/**'] },
    },
    preview: { headers: productionHeaders() },
    build: {
      // Inlined assets become data: URLs, which the Content-Security-Policy in public/_headers blocks.
      assetsInlineLimit: 0,
      rolldownOptions: { input: { index: fromRoot('./index.html'), notFound: fromRoot('./404.html') } },
    },
    plugins: [
      react(),
      rootOnly(),
      {
        name: 'site-metadata',
        transformIndexHtml(_html, context) {
          if (context.path !== '/index.html') return
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
            { tag: 'meta', attrs: { name: 'twitter:card', content: siteUrl ? 'summary_large_image' : 'summary' }, injectTo: 'head' as const },
            ...(siteUrl ? [
              { tag: 'link', attrs: { rel: 'canonical', href: siteUrl }, injectTo: 'head' as const },
              { tag: 'meta', attrs: { property: 'og:url', content: siteUrl }, injectTo: 'head' as const },
              { tag: 'meta', attrs: { property: 'og:image', content: new URL(shareImage.path, siteUrl).href }, injectTo: 'head' as const },
              { tag: 'meta', attrs: { property: 'og:image:type', content: 'image/jpeg' }, injectTo: 'head' as const },
              { tag: 'meta', attrs: { property: 'og:image:width', content: shareImage.width }, injectTo: 'head' as const },
              { tag: 'meta', attrs: { property: 'og:image:height', content: shareImage.height }, injectTo: 'head' as const },
              { tag: 'meta', attrs: { property: 'og:image:alt', content: shareImage.alt }, injectTo: 'head' as const },
              { tag: 'meta', attrs: { name: 'twitter:image', content: new URL(shareImage.path, siteUrl).href }, injectTo: 'head' as const },
              { tag: 'meta', attrs: { name: 'twitter:image:alt', content: shareImage.alt }, injectTo: 'head' as const },
            ] : []),
          ]
        },
        generateBundle() {
          this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\n${siteUrl ? `\nSitemap: ${siteUrl}sitemap.xml\n` : ''}` })
          if (!siteUrl) return
          const urls = liveUrls.map((url) => `  <url><loc>${escapeHtml(url)}</loc></url>`).join('\n')
          this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n` })
        },
      },
    ],
  }
})
