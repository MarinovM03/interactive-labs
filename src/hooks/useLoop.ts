import { useEffect, useState } from 'react'

export function useLoop(target: Element | null, enabled: boolean) {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null)
  const [failed, setFailed] = useState(false)
  const [onScreen, setOnScreen] = useState(false)
  const [pageVisible, setPageVisible] = useState(() => !document.hidden)
  const [armed, setArmed] = useState(false)
  const [playing, setPlaying] = useState(false)
  const active = enabled && !failed
  const shouldPlay = active && onScreen && pageVisible
  if (shouldPlay && !armed) setArmed(true)

  useEffect(() => {
    if (!active || !target || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.3 })
    observer.observe(target)
    const onVisibility = () => setPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [active, target])

  useEffect(() => {
    if (!video) return
    if (shouldPlay) {
      void video.play().catch(() => setPlaying(false))
    } else {
      video.pause()
    }
  }, [shouldPlay, video])

  return {
    setVideo,
    active,
    armed: armed && active,
    playing: playing && active,
    fail: () => setFailed(true),
    onPlaying: () => setPlaying(true),
    onPause: () => setPlaying(false),
  }
}
