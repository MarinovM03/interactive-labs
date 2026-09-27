export type LabStatus = 'live' | 'soon'
export type LabGlyph = 'wave' | 'coins'

export type LabMedia = {
  poster: string
  alt: string
  /** Only a capture that loops without a visible seam. It autoplays muted, so a weak clip is worse than none. */
  loop?: { mp4?: string; webm?: string }
}

export type Lab = {
  id: string
  title: string
  tagline: string
  assumption: string
  reveal: string
  category: string
  href: string
  /** Stays `soon` until `href` is mounted and tested on the shared domain; `live` makes the card a link. */
  status: LabStatus
  media: LabMedia
  swatch: string
  glyph?: LabGlyph
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
    media: {
      poster: '/media/labs/standing-wave/poster.webp',
      alt: 'Still from Standing Wave: a glass room with a glowing orange floor, a speaker on the back wall and a microphone on a stand.',
    },
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
    media: {
      poster: '/media/labs/coin-table/poster.webp',
      alt: 'Still from The Coin Table: gold coins stamped with amounts in sats, spread across a dark table marked Your wallet.',
    },
    swatch: '#b88c3a',
    glyph: 'coins',
  },
]

export const pad = (n: number) => String(n).padStart(2, '0')
