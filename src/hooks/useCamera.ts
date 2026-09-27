import { useCallback, useEffect, useRef, useState } from 'react'

type Mode = 'idle' | 'scrub' | 'sweep' | 'return'

/** Detent marks along the timeline. A soft tick plays as the playhead crosses each one. */
export const DETENTS = 8

const clamp = (value: number) => Math.min(1, Math.max(0, value))
const seconds = (value: number) => value.toFixed(1).padStart(4, '0')

export function useCamera({ enabled, onDetent }: { enabled: boolean; onDetent: () => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const surface = useRef<HTMLDivElement>(null)
  const readout = useRef<HTMLSpanElement>(null)
  const [failed, setFailed] = useState(false)
  const [armed, setArmed] = useState(false)
  const [ready, setReady] = useState(false)
  const [engaged, setEngaged] = useState(false)
  const usable = enabled && !failed
  const detent = useRef(onDetent)
  detent.current = onDetent

  const state = useRef({ mode: 'idle' as Mode, target: 0, shown: 0, seeking: false, duration: 0, lastDetent: 0, frame: 0 })

  const paint = useCallback((progress: number) => {
    const s = state.current
    surface.current?.style.setProperty('--progress', progress.toFixed(4))
    if (readout.current && s.duration) readout.current.textContent = `${seconds(progress * s.duration)} / ${seconds(s.duration)} s`
    const mark = Math.round(progress * DETENTS)
    if (mark !== s.lastDetent) {
      s.lastDetent = mark
      if (s.mode === 'scrub' || s.mode === 'sweep') detent.current()
    }
  }, [])

  const loop = useCallback(() => {
    const s = state.current
    const v = video.current
    s.frame = 0
    if (!v || !s.duration || s.mode === 'idle') return
    if (s.mode === 'sweep') {
      const progress = clamp(v.currentTime / s.duration)
      paint(progress)
      if (v.ended || progress > 0.99) {
        v.pause()
        s.shown = progress
        s.target = 0
        s.mode = 'return'
      }
    } else if (!s.seeking) {
      const gap = s.target - s.shown
      if (Math.abs(gap) > 0.003) {
        s.shown = Math.abs(gap) < 0.015 ? s.target : s.shown + gap * (s.mode === 'return' ? 0.42 : 0.62)
        s.seeking = true
        v.currentTime = s.shown * (s.duration - 0.05)
      } else if (s.mode === 'return') {
        s.mode = 'idle'
        setEngaged(false)
        paint(0)
        return
      }
      paint(s.mode === 'scrub' ? s.target : s.shown)
    }
    s.frame = requestAnimationFrame(loop)
  }, [paint])

  const run = useCallback(() => {
    if (!state.current.frame) state.current.frame = requestAnimationFrame(loop)
  }, [loop])

  const scrubTo = useCallback((fraction: number) => {
    if (!usable) return
    const s = state.current
    setArmed(true)
    if (s.mode === 'sweep' && video.current) { video.current.pause(); s.shown = clamp(video.current.currentTime / (s.duration || 1)) }
    s.mode = 'scrub'
    s.target = clamp(fraction)
    if (s.duration) { setEngaged(true); run() }
  }, [usable, run])

  const sweep = useCallback(() => {
    if (!usable) return
    const s = state.current
    setArmed(true)
    s.mode = 'sweep'
    const v = video.current
    if (!v || !s.duration) return
    s.lastDetent = 0
    v.currentTime = 0
    void v.play().then(() => { if (s.mode === 'sweep') { setEngaged(true); run() } }).catch(() => { s.mode = 'idle'; setEngaged(false) })
  }, [usable, run])

  const release = useCallback(() => {
    const s = state.current
    if (s.mode === 'idle') return
    if (s.mode === 'sweep' && video.current) { video.current.pause(); s.shown = clamp(video.current.currentTime / (s.duration || 1)) }
    s.target = 0
    if (s.duration) { s.mode = 'return'; run() } else s.mode = 'idle'
  }, [run])

  const fail = useCallback(() => {
    state.current.mode = 'idle'
    setFailed(true)
    setEngaged(false)
  }, [])

  // Wire the element once it mounts. Intent recorded before data arrives is replayed.
  useEffect(() => {
    const v = video.current
    if (!armed || !v) return
    const s = state.current
    const onLoaded = () => {
      if (s.duration) return
      s.duration = v.duration || 0
      setReady(true)
      paint(s.shown)
      if (s.mode === 'scrub') { setEngaged(true); run() }
      else if (s.mode === 'sweep') sweep()
    }
    const onSeeked = () => { s.seeking = false }
    v.addEventListener('loadeddata', onLoaded)
    v.addEventListener('seeked', onSeeked)
    v.addEventListener('error', fail)
    if (v.readyState >= 2) onLoaded()
    // Some mobile browsers ignore preload until playback is requested; a muted play/pause starts the fetch.
    else if (window.matchMedia('(pointer: coarse)').matches) void v.play().then(() => { if (s.mode !== 'sweep') v.pause() }).catch(() => {})
    return () => {
      v.removeEventListener('loadeddata', onLoaded)
      v.removeEventListener('seeked', onSeeked)
      v.removeEventListener('error', fail)
    }
  }, [armed, fail, paint, run, sweep])

  // Park the camera when the tab is hidden; stop the loop on unmount.
  useEffect(() => {
    const s = state.current
    const onVisibility = () => { if (document.hidden) release() }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      cancelAnimationFrame(s.frame)
      s.frame = 0
    }
  }, [release])

  useEffect(() => {
    if (usable) return
    state.current.mode = 'idle'
    video.current?.pause()
  }, [usable])

  return {
    video, surface, readout, fail,
    usable,
    armed: armed && usable,
    loading: armed && usable && !ready,
    engaged: engaged && usable,
    scrubTo, sweep, release,
  }
}
