export type LabStatus = 'live' | 'soon'
export type LabGlyph = 'wave' | 'coins'

export type Lab = {
  id: string
  title: string
  /** One line used for search results, the no-JS fallback, and screen reader descriptions. */
  tagline: string
  /** What most people assume before playing. Rendered struck through. */
  assumption: string
  /** What the lab makes visible instead. */
  reveal: string
  category: string
  href: string
  status: LabStatus
  poster: string
  videoMp4?: string
  videoWebm?: string
  swatch: string
  glyph: LabGlyph
}

export const labs: Lab[] = [
  {
    id: 'standing-wave',
    title: 'Standing Wave',
    tagline: 'Same speaker. Different bass. The room is stacking the wave.',
    assumption: 'The speaker decides the bass.',
    reveal: 'The room does. Reflections stack into a standing wave.',
    category: 'Sound & space',
    href: '/standing-wave/',
    status: 'soon',
    poster: '/media/labs/standing-wave/poster.webp',
    videoMp4: '/media/labs/standing-wave/preview.mp4',
    videoWebm: '/media/labs/standing-wave/preview.webm',
    swatch: '#d5652c',
    glyph: 'wave',
  },
  {
    id: 'coin-table',
    title: 'The Coin Table',
    tagline: 'Your wallet isn’t a balance. It’s a pile of coins.',
    assumption: 'A wallet holds a balance.',
    reveal: 'It holds coins: unspent outputs you can sign for.',
    category: 'Bitcoin, made tangible',
    href: '/coin-table/',
    status: 'soon',
    poster: '/media/labs/coin-table/poster.webp',
    videoMp4: '/media/labs/coin-table/preview.mp4',
    videoWebm: '/media/labs/coin-table/preview.webm',
    swatch: '#b88c3a',
    glyph: 'coins',
  },
]

export const pad = (n: number) => String(n).padStart(2, '0')
