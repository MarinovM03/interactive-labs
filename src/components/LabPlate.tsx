import { useRef } from 'react'
import type { CSSProperties, PointerEvent } from 'react'
import { pad } from '../data/labs'
import type { Lab } from '../data/labs'
import { Glyph } from './Glyph'
import { useSound } from '../audio/Sound'
import { useLoop } from '../hooks/useLoop'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useSeen } from '../hooks/useSeen'
import './LabPlate.css'

type Props = {
  lab: Lab
  number: number
  position: number
  setSize: number
}

const saveData = () => Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData)

export function LabPlate({ lab, number, position, setSize }: Props) {
  const card = useRef<HTMLElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const seen = useSeen(card, 0.15)
  const sound = useSound()
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const { media } = lab
  const loop = useLoop(frame, Boolean(media.loop?.mp4 || media.loop?.webm) && !reducedMotion && !saveData())
  const live = lab.status === 'live'
  const lastSource = media.loop?.webm ? 'webm' : 'mp4'

  function onPointerMove(event: PointerEvent) {
    if (!live || event.pointerType !== 'mouse' || !frame.current) return
    const rect = frame.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const style = frame.current.style
    style.setProperty('--px', `${x.toFixed(1)}px`)
    style.setProperty('--py', `${y.toFixed(1)}px`)
    style.setProperty('--chip-x', x > rect.width * 0.62 ? 'calc(-100% - 14px)' : '14px')
    style.setProperty('--chip-y', y > rect.height * 0.7 ? 'calc(-100% - 14px)' : '14px')
  }

  const classes = ['plate', live ? 'is-live' : 'is-soon', seen && 'is-seen', loop.playing && 'is-playing'].filter(Boolean).join(' ')

  return (
    // A live card's link is its tab stop; a soon card has no link, so the card itself takes focus.
    <article ref={card} id={lab.id} className={classes} tabIndex={live ? -1 : 0}
      aria-labelledby={`${lab.id}-title`} aria-describedby={`${lab.id}-hook`} aria-posinset={position} aria-setsize={setSize}
      style={{ '--swatch': lab.swatch } as CSSProperties} onPointerMove={onPointerMove}>
      <p className="plate-meta">
        <span className="plate-no">Nº {pad(number)}</span>
        <span className="plate-cat">{lab.category}</span>
        {lab.glyph && <Glyph kind={lab.glyph} className="plate-glyph" />}
      </p>

      <figure className="plate-figure">
        <div className="plate-frame" ref={frame}>
          <span className="plate-mount" aria-hidden="true" />
          <div className="plate-image">
            <img src={media.poster} alt={media.alt} width="1200" height="750" draggable={false}
              loading={number <= 2 ? 'eager' : 'lazy'} fetchPriority={number === 1 ? 'high' : 'auto'} decoding="async"
              onError={(event) => { event.currentTarget.style.visibility = 'hidden' }} />
            {loop.armed && (
              <video ref={loop.video} className="plate-video" muted loop playsInline autoPlay preload="auto" aria-hidden="true" tabIndex={-1}
                disablePictureInPicture disableRemotePlayback onPlaying={loop.onPlaying} onPause={loop.onPause} onError={loop.fail}>
                {media.loop?.mp4 && <source src={media.loop.mp4} type="video/mp4" onError={lastSource === 'mp4' ? loop.fail : undefined} />}
                {media.loop?.webm && <source src={media.loop.webm} type="video/webm" onError={lastSource === 'webm' ? loop.fail : undefined} />}
              </video>
            )}
            {live && <span className="plate-chip" aria-hidden="true">Open lab <b>↗</b></span>}
          </div>
          <span className="crop crop--tl" aria-hidden="true" />
          <span className="crop crop--tr" aria-hidden="true" />
          <span className="crop crop--bl" aria-hidden="true" />
          <span className="crop crop--br" aria-hidden="true" />
        </div>
        <figcaption className="plate-caption">{loop.active ? 'Muted loop, captured from the lab' : 'Still, captured from the lab'}</figcaption>
      </figure>

      <h3 className="plate-title" id={`${lab.id}-title`}>{lab.title}</h3>
      <p className="plate-hook" id={`${lab.id}-hook`}>
        <span className="sr-only">You’d think: </span>
        <s>{lab.assumption}</s>
        <span className="sr-only"> The lab shows: </span>
        <span className="plate-reveal">{lab.reveal}</span>
      </p>

      <div className="plate-foot">
        <p className="plate-status"><i aria-hidden="true" />{live ? 'Live' : 'Coming soon'}</p>
        {live ? (
          <a className="plate-open" href={lab.href} aria-label={`Open lab: ${lab.title}`} onClick={() => sound.play('click')}>
            <span>Open lab</span><b aria-hidden="true">↗</b>
          </a>
        ) : (
          <span className="plate-path"><code>{lab.href}</code> not mounted yet</span>
        )}
      </div>
    </article>
  )
}
