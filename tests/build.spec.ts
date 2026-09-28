import { test, expect } from '@playwright/test'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { labs } from '../src/data/labs.ts'

const vite = join(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js')

function build(siteUrl: string) {
  const outDir = mkdtempSync(join(tmpdir(), 'hub-build-'))
  const result = spawnSync(process.execPath, [vite, 'build', '--outDir', outDir, '--emptyOutDir', '--logLevel', 'error'], {
    env: { ...process.env, SITE_URL: siteUrl },
    encoding: 'utf8',
  })
  const read = (file: string) => readFileSync(join(outDir, file), 'utf8')
  return { ok: result.status === 0, output: result.stderr + result.stdout, outDir, read, has: (file: string) => existsSync(join(outDir, file)) }
}

test('without SITE_URL nothing claims a domain', () => {
  const site = build('')
  expect(site.ok, site.output).toBe(true)
  const html = site.read('index.html')
  expect(html).not.toMatch(/rel="canonical"|og:url|og:image|twitter:image/)
  expect(html).toContain('name="twitter:card" content="summary"')
  expect(site.read('robots.txt')).not.toContain('Sitemap:')
  expect(site.has('sitemap.xml')).toBe(false)
  expect(site.has('_headers')).toBe(true)
  expect(site.read('404.html')).not.toContain('application/ld+json')
  for (const lab of labs.filter((entry) => entry.status === 'soon')) expect(html).not.toContain(`href="${lab.href}"`)
})

test('with SITE_URL the share tags and sitemap are absolute and list only live paths', () => {
  const site = build('https://labs.example.test/')
  expect(site.ok, site.output).toBe(true)
  const html = site.read('index.html')
  expect(html).toContain('<link rel="canonical" href="https://labs.example.test/">')
  expect(html).toContain('content="https://labs.example.test/media/share.jpg"')
  expect(site.read('robots.txt')).toContain('Sitemap: https://labs.example.test/sitemap.xml')
  const sitemap = site.read('sitemap.xml')
  for (const lab of labs) expect(sitemap.includes(`https://labs.example.test${lab.href}`)).toBe(lab.status === 'live')
})

test('an invalid SITE_URL fails the build', () => {
  const site = build('https://labs.example.test/some/path')
  expect(site.ok).toBe(false)
  expect(site.output).toContain('SITE_URL must be a full http(s) origin')
})
