export type LabStatus = 'live' | 'soon'
export type LabGlyph = 'wave' | 'coins'

export type LabMedia = {
  /** 1200 × 750 still captured from the lab build. Always shown first, and the only media under reduced motion. */
  poster: string
  /** Describes what the still shows, for screen readers and search. */
  alt: string
  /** 240 × 150 downscale of the poster for the index. Falls back to the poster. */
  thumb?: string
  /**
   * A real capture that loops without a visible seam. Autoplays muted while on screen.
   * Leave this out until such a capture exists; the poster is the honest default.
   */
  loop?: { mp4?: string; webm?: string }
}

export type Lab = {
  id: string
  title: string
  /** One line used for search results and the no-JS fallback. */
  tagline: string
  /** What most people assume before playing. Rendered struck through. */
  assumption: string
  /** What the lab makes visible instead. */
  reveal: string
  category: string
  /** Public path of the separate lab app. Only linked once `status` is `live`. */
  href: string
  /** Stays `soon` until the path is mounted and tested on the shared domain. */
  status: LabStatus
  media: LabMedia
  /** Mount colour sampled from the poster. Decorative only, never used for text. */
  swatch: string
  /** Optional line mark for the plate header. */
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
      thumb: '/media/labs/standing-wave/thumb.webp',
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
      thumb: '/media/labs/coin-table/thumb.webp',
      alt: 'Still from The Coin Table: gold coins stamped with amounts in sats, spread across a dark table marked Your wallet.',
    },
    swatch: '#b88c3a',
    glyph: 'coins',
  },
]

export const pad = (n: number) => String(n).padStart(2, '0')
