import { useEffect, useState } from 'react'
import type { RefObject } from 'react'

export function useSeen(ref: RefObject<Element | null>, threshold = 0.2) {
  const [seen, setSeen] = useState(() => !('IntersectionObserver' in window))
  useEffect(() => {
    const element = ref.current
    if (!element || seen) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setSeen(true); observer.disconnect() }
    }, { threshold })
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, seen, threshold])
  return seen
}
