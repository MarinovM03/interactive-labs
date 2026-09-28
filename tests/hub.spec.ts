import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { labs, pad } from '../src/data/labs.ts'

const live = labs.filter((lab) => lab.status === 'live')
const soon = labs.filter((lab) => lab.status === 'soon')

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const seen: string[] = []
    Object.assign(window, { policyViolations: seen })
    document.addEventListener('securitypolicyviolation', (event) => seen.push(`${event.violatedDirective} ${event.blockedURI}`))
  })
})

test.afterEach(async ({ page }) => {
  expect(await page.evaluate(() => (window as unknown as { policyViolations?: string[] }).policyViolations ?? [])).toEqual([])
})

async function settled(page: Page) {
  await page.waitForFunction(() => document.getAnimations().every((animation) => animation.playState !== 'running' || animation.effect?.getTiming().iterations === Infinity))
}

test('every lab is a visible card with its still, title and hook', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('feed').getByRole('article')).toHaveCount(labs.length)
  for (const lab of labs) {
    const card = page.locator(`article#${lab.id}`)
    await expect(card.getByRole('heading', { level: 3 })).toHaveText(lab.title)
    await expect(card.getByRole('img', { name: lab.media.alt })).toBeVisible()
    await expect(card.locator('s')).toHaveText(lab.assumption)
    await expect(card.locator('.plate-reveal')).toHaveText(lab.reveal)
    if (lab.status === 'live') await expect(card.getByRole('link', { name: `Open lab: ${lab.title}` })).toHaveAttribute('href', lab.href)
    else await expect(card.getByRole('link')).toHaveCount(0)
  }
})

test('stats are counted from the lab list', async ({ page }) => {
  await page.goto('/')
  const stats = page.getByRole('definition')
  await expect(stats.nth(0)).toHaveText(pad(labs.length))
  await expect(stats.nth(1)).toHaveText(pad(labs.length))
  await expect(stats.nth(2)).toContainText(`${live.length} of ${labs.length}`)
})

test('filters narrow the index and never hide labs by default', async ({ page }) => {
  await page.goto('/')
  const cards = page.getByRole('feed').getByRole('article')
  await expect(page.getByRole('button', { name: /^All/ })).toHaveAttribute('aria-pressed', 'true')
  const liveChip = page.getByRole('button', { name: /^Live/ })
  if (live.length === 0) await expect(liveChip).toBeDisabled()
  if (soon.length > 0) {
    await page.getByRole('button', { name: /^Soon/ }).click()
    await expect(cards).toHaveCount(soon.length)
  }
  await page.getByRole('button', { name: /^All/ }).click()
  await expect(cards).toHaveCount(labs.length)
})

test('keyboard moves between cards', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop' || labs.length < 2, 'arrow keys are a desktop pattern')
  await page.goto('/')
  const first = page.locator(`article#${labs[0].id}`)
  const firstTarget = labs[0].status === 'live' ? first.getByRole('link') : first
  await firstTarget.focus()
  await page.keyboard.press('ArrowRight')
  const second = page.locator(`article#${labs[1].id}`)
  await expect(labs[1].status === 'live' ? second.getByRole('link') : second).toBeFocused()
  await page.keyboard.press('Home')
  await expect(firstTarget).toBeFocused()
})

test('the hub serves only its root; lab paths are an honest 404', async ({ page }) => {
  const root = await page.goto('/')
  expect(root?.status()).toBe(200)
  expect(root?.headers()['content-security-policy']).toContain("frame-ancestors 'none'")
  for (const path of [...labs.map((lab) => lab.href), '/not-a-page']) {
    const response = await page.goto(path)
    expect(response?.status(), path).toBe(404)
    expect(response?.headers()['content-security-policy'], path).toContain("default-src 'self'")
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('A little ahead of us.')
  }
})

test('no automatic accessibility violations on the index or the 404', async ({ page }) => {
  for (const path of ['/', '/not-a-page']) {
    await page.goto(path)
    await settled(page)
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
    expect(results.violations.map((violation) => `${path} ${violation.id}: ${violation.nodes.map((node) => node.target).join(', ')}`)).toEqual([])
  }
})

test('reduced motion shows every card in its final state without video', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  for (const lab of labs) await expect(page.locator(`article#${lab.id} .plate-reveal`)).toHaveCSS('opacity', '1')
  await expect(page.locator('video')).toHaveCount(0)
})

test('High Contrast and print keep the misconception struck through', async ({ page }) => {
  await page.goto('/')
  await page.emulateMedia({ forcedColors: 'active' })
  for (const strike of await page.locator('.plate-hook s').all()) await expect(strike).toHaveCSS('text-decoration-line', 'line-through')
  await page.emulateMedia({ forcedColors: 'none', media: 'print' })
  for (const lab of labs) {
    await expect(page.locator(`article#${lab.id} .plate-image`)).toHaveCSS('clip-path', 'none')
    await expect(page.locator(`article#${lab.id} .plate-hook s`)).toHaveCSS('text-decoration-line', 'line-through')
  }
  await expect(page.locator('.index-filters')).toBeHidden()
})
