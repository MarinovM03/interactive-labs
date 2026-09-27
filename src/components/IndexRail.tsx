import { useLayoutEffect, useRef, useState } from 'react'
import { pad } from '../data/labs'
import type { Lab } from '../data/labs'
import { Glyph } from './Glyph'
import { Mark } from './Mark'
import { SoundToggle, useSound } from '../audio/Sound'
import { useMediaQuery } from '../hooks/useMediaQuery'
import './IndexRail.css'

type Props = {
  labs: Lab[]
  activeId: string
  cuedId: string | null
  onCue: (id: string | null) => void
  onJump: (id: string) => void
}

export function IndexRail({ labs, activeId, cuedId, onCue, onJump }: Props) {
  const list = useRef<HTMLOListElement>(null)
  const [marker, setMarker] = useState<{ top: number; height: number } | null>(null)
  const sound = useSound()
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const touch = useMediaQuery('(hover: none)')

  // The marker is one element that travels between rows, so the eye follows the change.
  useLayoutEffect(() => {
    const element = list.current
    if (!element) return
    const measure = () => {
      const row = element.querySelector<HTMLElement>(`[data-lab="${activeId}"]`)
      if (row) setMarker({ top: row.offsetTop, height: row.offsetHeight })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [activeId])

  const legend = reducedMotion
    ? 'Reduced motion is on, so each plate stays a still.'
    : touch ? 'Drag a plate sideways to move its camera.' : 'Move across a plate to steer its camera.'

  return (
    <header className="rail">
      <div className="rail-top">
        <a className="lockup" href="/" aria-label="Interactive Labs by Marinov, home">
          <Mark />
          <span>Marinov</span>
        </a>
        <SoundToggle />
      </div>

      <div className="rail-hero">
        <h1 className="display">
          <span className="display-line"><span>Interactive</span></span>{' '}
          <span className="display-line"><span>Labs<sup className="display-count" aria-hidden="true">({pad(labs.length)})</sup></span></span>
        </h1>
        <p className="lede"><strong>Playable 3D explainers.</strong> Each one makes a single misconception visible.</p>
      </div>

      <nav className="index" aria-label="Labs on this page">
        <div className="index-head" aria-hidden="true">
          <span>Index</span>
          <span>{pad(labs.length)} labs</span>
        </div>
        <ol className="index-list" ref={list}>
          {labs.map((lab, index) => {
            const active = lab.id === activeId
            return (
              <li key={lab.id} data-lab={lab.id}
                className={['index-item', active && 'is-active', cuedId === lab.id && 'is-cued'].filter(Boolean).join(' ')}>
                <a className="index-row" href={`#${lab.id}`} aria-current={active ? 'location' : undefined}
                  onPointerEnter={(event) => { if (event.pointerType === 'mouse') { onCue(lab.id); sound.play('hover') } }}
                  onPointerLeave={() => onCue(null)}
                  onFocus={() => onCue(lab.id)} onBlur={() => onCue(null)}
                  onClick={() => { sound.play('click'); onJump(lab.id) }}>
                  <span className="index-no">{pad(index + 1)}</span>
                  <span className="index-name">
                    <span className="index-title">{lab.title}</span>
                    <span className="index-cat">{lab.category}</span>
                  </span>
                  <Glyph kind={lab.glyph} className="index-glyph" />
                  <span className="index-status">{lab.status === 'live' ? 'Live' : 'Soon'}</span>
                  <span className="index-loupe" aria-hidden="true">
                    <img src={lab.poster} alt="" width="1200" height="750" loading="lazy" decoding="async" />
                  </span>
                </a>
              </li>
            )
          })}
        </ol>
        {marker && <span className="index-marker" aria-hidden="true" style={{ transform: `translateY(${marker.top}px)`, height: marker.height }} />}
      </nav>

      <p className="rail-legend">{legend}</p>
    </header>
  )
}
