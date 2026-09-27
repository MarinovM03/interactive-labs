import { useEffect, useState } from 'react'
import type { RefObject } from 'react'

/** Flips to true the first time the element is meaningfully on screen, then stops observing. */
export function useSeen(ref: RefObject<Element | null>, threshold = 0.2) {
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const element = ref.current
    if (!element || seen) return
    if (!('IntersectionObserver' in window)) { setSeen(true); return }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setSeen(true); observer.disconnect() }
    }, { threshold })
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, seen, threshold])
  return seen
}
