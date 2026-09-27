import type { CSSProperties } from 'react'
import type { LabGlyph } from '../data/labs'

function wavePath(sign: 1 | -1) {
  const points: string[] = []
  for (let x = 0; x <= 64; x += 2) {
    const y = 12 - sign * 8 * Math.sin((Math.PI * x) / 32)
    points.push(`${(x + 4).toFixed(0)} ${y.toFixed(2)}`)
  }
  return `M${points.join('L')}`
}

const upper = wavePath(1)
const lower = wavePath(-1)
const coins = [
  { cx: 12, cy: 13, r: 7 },
  { cx: 26, cy: 8, r: 4.5 },
  { cx: 36, cy: 15, r: 6 },
  { cx: 49, cy: 9, r: 5 },
  { cx: 60, cy: 15, r: 5.5 },
]

/** A small line mark that states what each lab is about. Animates only while its parent is engaged. */
export function Glyph({ kind, className = '' }: { kind: LabGlyph; className?: string }) {
  return (
    <svg className={`glyph glyph--${kind} ${className}`} viewBox="0 0 72 24" aria-hidden="true" focusable="false">
      {kind === 'wave' ? (
        <>
          <path className="glyph-envelope" d={upper} />
          <path className="glyph-envelope" d={lower} />
          <line className="glyph-axis" x1="4" y1="12" x2="68" y2="12" />
          <g className="glyph-wave"><path d={upper} /></g>
          {[4, 36, 68].map((x) => <circle key={x} className="glyph-node" cx={x} cy="12" r="1.6" />)}
        </>
      ) : (
        coins.map((coin, index) => <circle key={index} className="glyph-coin" style={{ '--i': index } as CSSProperties} {...coin} />)
      )}
    </svg>
  )
}
