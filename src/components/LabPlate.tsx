import { useRef, useState } from 'react'
import type { CSSProperties, FocusEvent, MouseEvent, PointerEvent } from 'react'
import { pad } from '../data/labs'
import type { Lab } from '../data/labs'
import { Glyph } from './Glyph'
import { useSound } from '../audio/Sound'
import { DETENTS, useCamera } from '../hooks/useCamera'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useSeen } from '../hooks/useSeen'
import './LabPlate.css'

type Props = {
  lab: Lab
  index: number
  cued: boolean
  onCue: (id: string | null) => void
}

const saveData = () => Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData)

export function LabPlate({ lab, index, cued, onCue }: Props) {
  const article = useRef<HTMLElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const sound = useSound()
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const hasVideo = Boolean(lab.videoMp4 || lab.videoWebm)
  const camera = useCamera({ enabled: hasVideo && !reducedMotion && !saveData(), onDetent: () => sound.play('detent') })
  const seen = useSeen(article, 0.15)
  const [hovering, setHovering] = useState(false)
  const [nudged, setNudged] = useState(false)
  const hover = useRef(false)
  const drag = useRef<{ id: number; x: number; y: number; active: boolean } | null>(null)
  const suppressClick = useRef(false)
  const pointerType = useRef('mouse')
  const live = lab.status === 'live'
  const number = pad(index + 1)
  const lastSource = lab.videoWebm ? 'webm' : 'mp4'

  function locate(event: PointerEvent) {
    const rect = frame.current?.getBoundingClientRect()
    if (!rect) return null
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    return { inside: x >= 0 && y >= 0 && x <= rect.width && y <= rect.height, fraction: x / rect.width, x, y, width: rect.width, height: rect.height }
  }

  function engage() {
    if (hover.current) return
    hover.current = true
    setHovering(true)
    onCue(lab.id)
    sound.play('hover')
  }

  function disengage() {
    if (!hover.current) return
    hover.current = false
    setHovering(false)
    onCue(null)
    camera.release()
  }

  function onPointerMove(event: PointerEvent) {
    const spot = locate(event)
    if (!spot) return
    if (event.pointerType === 'touch') {
      const current = drag.current
      if (!current || current.id !== event.pointerId) return
      const dx = event.clientX - current.x
      const dy = event.clientY - current.y
      if (!current.active && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        current.active = true
        onCue(lab.id)
        sound.play('hover')
      }
      if (current.active) camera.scrubTo(spot.fraction)
      return
    }
    if (!spot.inside) { disengage(); return }
    const style = frame.current?.style
    style?.setProperty('--px', `${spot.x.toFixed(1)}px`)
    style?.setProperty('--py', `${spot.y.toFixed(1)}px`)
    style?.setProperty('--chip-x', spot.x > spot.width * 0.72 ? 'calc(-100% - 16px)' : '16px')
    style?.setProperty('--chip-y', spot.y > spot.height * 0.7 ? 'calc(-100% - 16px)' : '16px')
    engage()
    camera.scrubTo(spot.fraction)
  }

  function onPointerDown(event: PointerEvent) {
    pointerType.current = event.pointerType
    if (event.pointerType !== 'touch') return
    const spot = locate(event)
    drag.current = spot?.inside ? { id: event.pointerId, x: event.clientX, y: event.clientY, active: false } : null
  }

  function endDrag(cancelled: boolean) {
    const current = drag.current
    drag.current = null
    if (!current?.active) return
    if (!cancelled) {
      suppressClick.current = true
      window.setTimeout(() => { suppressClick.current = false }, 450)
    }
    onCue(null)
    window.setTimeout(camera.release, 280)
  }

  function onClickCapture(event: MouseEvent) {
    if (!suppressClick.current) return
    suppressClick.current = false
    event.preventDefault()
    event.stopPropagation()
  }

  function onKeyFocus(event: FocusEvent<HTMLElement>) {
    if (!event.currentTarget.matches(':focus-visible')) return
    onCue(lab.id)
    camera.sweep()
  }

  function onKeyBlur() {
    if (hover.current) return
    onCue(null)
    camera.release()
  }

  function onPreview(event: MouseEvent) {
    sound.play('click')
    // Mouse users already steer the camera by hovering; a click there only confirms the lab is not open yet.
    if (event.detail !== 0 && pointerType.current === 'mouse') {
      setNudged(true)
      window.setTimeout(() => setNudged(false), 520)
      return
    }
    camera.sweep()
  }

  const classes = [
    'plate',
    live ? 'is-live' : 'is-soon',
    index % 2 ? 'plate--even' : 'plate--odd',
    seen && 'is-seen',
    hovering && 'is-hovering',
    cued && 'is-cued',
    camera.engaged && 'is-engaged',
    camera.loading && 'is-loading',
    camera.usable && 'has-camera',
    nudged && 'is-nudged',
  ].filter(Boolean).join(' ')

  return (
    <article ref={article} id={lab.id} className={classes} aria-labelledby={`${lab.id}-title`}
      style={{ '--swatch': lab.swatch } as CSSProperties}
      onPointerMove={onPointerMove} onPointerLeave={(event) => { if (event.pointerType !== 'touch') disengage() }}
      onPointerDown={onPointerDown} onPointerUp={() => endDrag(false)} onPointerCancel={() => endDrag(true)}
      onClickCapture={onClickCapture}>
      <div className="plate-meta">
        <span className="plate-no">Nº {number}</span>
        <span className="plate-cat">{lab.category}</span>
        <Glyph kind={lab.glyph} className="plate-glyph" />
      </div>

      <div className="plate-frame" ref={frame}>
        <span className="plate-mount" aria-hidden="true" />
        <div className="plate-image" ref={camera.surface}>
          <img src={lab.poster} alt="" width="1200" height="750" draggable={false}
            loading={index === 0 ? 'eager' : 'lazy'} fetchPriority={index === 0 ? 'high' : 'auto'} decoding="async"
            onError={(event) => { event.currentTarget.style.visibility = 'hidden' }} />
          {camera.armed && (
            <video ref={camera.video} className="plate-video" muted playsInline preload="auto" aria-hidden="true" tabIndex={-1}
              disablePictureInPicture disableRemotePlayback>
              {lab.videoMp4 && <source src={lab.videoMp4} type="video/mp4" onError={lastSource === 'mp4' ? camera.fail : undefined} />}
              {lab.videoWebm && <source src={lab.videoWebm} type="video/webm" onError={lastSource === 'webm' ? camera.fail : undefined} />}
            </video>
          )}
          {camera.usable && (
            <>
              <span className="plate-playhead" aria-hidden="true" />
              <div className="plate-timeline" aria-hidden="true">
                <span className="plate-timeline-label">{camera.loading ? 'Loading' : 'Camera'}</span>
                <span className="plate-track">
                  <i className="plate-fill" />
                  {Array.from({ length: DETENTS + 1 }, (_, mark) => <i key={mark} className="plate-tick" style={{ '--mark': mark / DETENTS } as CSSProperties} />)}
                </span>
                <span className="plate-time" ref={camera.readout}>00.0 s</span>
              </div>
            </>
          )}
          <span className="plate-chip" aria-hidden="true">{live ? <>Open lab <b>↗</b></> : 'Coming soon'}</span>
        </div>
        <span className="crop crop--tl" aria-hidden="true" />
        <span className="crop crop--tr" aria-hidden="true" />
        <span className="crop crop--bl" aria-hidden="true" />
        <span className="crop crop--br" aria-hidden="true" />
        {!live && camera.usable && (
          <button className="plate-preview" type="button" aria-label={`Preview a camera move through ${lab.title}`}
            aria-describedby={`${lab.id}-status`} onFocus={onKeyFocus} onBlur={onKeyBlur} onClick={onPreview} />
        )}
      </div>

      {camera.usable && <p className="plate-hint" aria-hidden="true">Drag across to move the camera · Tap to {live ? 'open' : 'preview'}</p>}

      <div className="plate-body">
        <h2 className="plate-title" id={`${lab.id}-title`}>{lab.title}</h2>
        <dl className="plate-claim">
          <div className="claim claim--assumed"><dt>You’d think</dt><dd><s>{lab.assumption}</s></dd></div>
          <div className="claim claim--shown"><dt>The lab shows</dt><dd id={`${lab.id}-reveal`}>{lab.reveal}</dd></div>
        </dl>
        <div className="plate-foot">
          <p className="plate-status" id={`${lab.id}-status`}><i aria-hidden="true" />{live ? 'Live' : 'Coming soon'}</p>
          {live ? (
            <a className="plate-open" href={lab.href} aria-label={`Open lab: ${lab.title}`} aria-describedby={`${lab.id}-reveal`}
              onFocus={onKeyFocus} onBlur={onKeyBlur} onClick={() => sound.play('click')}>
              <span>Open lab</span><b aria-hidden="true">↗</b>
            </a>
          ) : (
            <span className="plate-path"><code>{lab.href}</code> not open yet</span>
          )}
        </div>
      </div>
    </article>
  )
}
