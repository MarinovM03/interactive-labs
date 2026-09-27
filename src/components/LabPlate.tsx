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

type Step = { prev: boolean; next: boolean; go: (direction: -1 | 1) => void }

type Props = {
  lab: Lab
  /** Position in the full index, starting at 1. */
  number: number
  total: number
  /** Inside the mobile index the row already carries the title and number. */
  compact?: boolean
  step?: Step
}

const saveData = () => Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData)

export function LabPlate({ lab, number, total, compact = false, step }: Props) {
  const article = useRef<HTMLElement>(null)
  const seen = useSeen(article, 0.15)
  const live = lab.status === 'live'

  const classes = ['plate', live ? 'is-live' : 'is-soon', compact && 'plate--compact', seen && 'is-seen'].filter(Boolean).join(' ')

  return (
    <article ref={article} className={classes} aria-labelledby={compact ? lab.id : `${lab.id}-title`}
      style={{ '--swatch': lab.swatch } as CSSProperties}>
      {!compact && (
        <div className="plate-meta">
          <span className="plate-no">Nº {pad(number)}<span className="plate-of"> / {pad(total)}</span></span>
          <span className="plate-cat">{lab.category}</span>
          {lab.glyph && <Glyph kind={lab.glyph} className="plate-glyph" />}
          {step && <StepButtons step={step} />}
        </div>
      )}
      {/* Keyed so the reveal replays and any loop state resets when the plate shows a different lab. */}
      <PlateStage key={lab.id} lab={lab} number={number} compact={compact} />
    </article>
  )
}

// aria-disabled rather than disabled: reaching the first or last lab must not throw keyboard focus away.
function StepButtons({ step }: { step: Step }) {
  return (
    <span className="plate-step" role="group" aria-label="Browse labs">
      <button type="button" aria-label="Previous lab" aria-disabled={!step.prev} onClick={() => { if (step.prev) step.go(-1) }}><span aria-hidden="true">←</span></button>
      <button type="button" aria-label="Next lab" aria-disabled={!step.next} onClick={() => { if (step.next) step.go(1) }}><span aria-hidden="true">→</span></button>
    </span>
  )
}

function PlateStage({ lab, number, compact }: { lab: Lab; number: number; compact: boolean }) {
  const frame = useRef<HTMLDivElement>(null)
  const sound = useSound()
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const { media } = lab
  const hasLoop = Boolean(media.loop?.mp4 || media.loop?.webm)
  const loop = useLoop(frame, hasLoop && !reducedMotion && !saveData())
  const live = lab.status === 'live'
  const lastSource = media.loop?.webm ? 'webm' : 'mp4'

  // Only a live plate is a link, so only a live plate gets the pointer-following "Open lab" chip.
  function onPointerMove(event: PointerEvent) {
    if (!live || event.pointerType !== 'mouse' || !frame.current) return
    const rect = frame.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const style = frame.current.style
    style.setProperty('--px', `${x.toFixed(1)}px`)
    style.setProperty('--py', `${y.toFixed(1)}px`)
    style.setProperty('--chip-x', x > rect.width * 0.72 ? 'calc(-100% - 16px)' : '16px')
    style.setProperty('--chip-y', y > rect.height * 0.7 ? 'calc(-100% - 16px)' : '16px')
  }

  return (
    <div className={`plate-stage${loop.playing ? ' is-playing' : ''}`} onPointerMove={onPointerMove}>
      <figure className="plate-figure">
        <div className="plate-frame" ref={frame}>
          <span className="plate-mount" aria-hidden="true" />
          <div className="plate-image">
            <img src={media.poster} alt={media.alt} width="1200" height="750" draggable={false}
              loading={number === 1 ? 'eager' : 'lazy'} fetchPriority={number === 1 ? 'high' : 'auto'} decoding="async"
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
        <figcaption className="plate-caption">
          <span className="plate-fig">Fig. {pad(number)}</span>
          {loop.active ? 'Muted loop, captured from the lab.' : 'Still, captured from the lab.'}
        </figcaption>
      </figure>

      <div className="plate-body">
        {!compact && <h2 className="plate-title" id={`${lab.id}-title`}>{lab.title}</h2>}
        <dl className="plate-claim">
          <div className="claim claim--assumed"><dt>You’d think</dt><dd><s>{lab.assumption}</s></dd></div>
          <div className="claim claim--shown"><dt>The lab shows</dt><dd id={`${lab.id}-reveal`}>{lab.reveal}</dd></div>
        </dl>
        <div className="plate-foot">
          <p className="plate-status"><i aria-hidden="true" />{live ? 'Live' : 'Coming soon'}</p>
          {live ? (
            <a className="plate-open" href={lab.href} aria-label={`Open lab: ${lab.title}`} aria-describedby={`${lab.id}-reveal`}
              onClick={() => sound.play('click')}>
              <span>Open lab</span><b aria-hidden="true">↗</b>
            </a>
          ) : (
            <span className="plate-path"><code>{lab.href}</code> opens once it’s mounted</span>
          )}
        </div>
      </div>
    </div>
  )
}
