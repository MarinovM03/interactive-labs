import { useEffect, useState } from 'react'

export function useScrollSpy(ids: string[]) {
  const [active, setActive] = useState(ids[0])
  const key = ids.join('|')
  useEffect(() => {
    const sections = key.split('|').map((id) => document.getElementById(id)).filter((el): el is HTMLElement => Boolean(el))
    if (!sections.length || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver((entries) => {
      const crossing = entries.filter((entry) => entry.isIntersecting)
      if (crossing.length) setActive(crossing[crossing.length - 1].target.id)
    }, { rootMargin: '-42% 0px -52% 0px' })
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [key])
  return [active, setActive] as const
}
