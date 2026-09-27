import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

export function useLoop(target: RefObject<Element | null>, enabled: boolean) {
  const video = useRef<HTMLVideoElement>(null)
  const [failed, setFailed] = useState(false)
  const [onScreen, setOnScreen] = useState(false)
  const [pageVisible, setPageVisible] = useState(() => !document.hidden)
  const [armed, setArmed] = useState(false)
  const [playing, setPlaying] = useState(false)
  const active = enabled && !failed
  const shouldPlay = active && onScreen && pageVisible

  useEffect(() => {
    const element = target.current
    if (!active || !element || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.3 })
    observer.observe(element)
    const onVisibility = () => setPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [active, target])

  useEffect(() => { if (shouldPlay) setArmed(true) }, [shouldPlay])

  useEffect(() => {
    const element = video.current
    if (!element) return
    if (shouldPlay) {
      element.muted = true
      void element.play().catch(() => setPlaying(false))
    } else {
      element.pause()
    }
  }, [shouldPlay, armed])

  return {
    video,
    active,
    armed: armed && active,
    playing: playing && active,
    fail: () => setFailed(true),
    onPlaying: () => setPlaying(true),
    onPause: () => setPlaying(false),
  }
}
