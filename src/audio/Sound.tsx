import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { tick, unlockAudio } from './ticks'
import type { Tick } from './ticks'

const preferenceKey = 'interactive-labs:sound'
const SoundContext = createContext({ enabled: false, toggle: () => {}, play: (_kind: Tick) => {} })

function readPreference() {
  try { return localStorage.getItem(preferenceKey) !== 'off' } catch { return true }
}

export function SoundProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(readPreference)
  useEffect(() => {
    if (!enabled) return
    const unlock = () => { void unlockAudio() }
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [enabled])

  const value = useMemo(() => ({
    enabled,
    toggle: () => {
      const next = !enabled
      setEnabled(next)
      try { localStorage.setItem(preferenceKey, next ? 'on' : 'off') } catch { /* Preference is optional. */ }
      if (next) void unlockAudio().then(() => tick('land'))
    },
    play: (kind: Tick) => { if (enabled) void unlockAudio().then(() => tick(kind)) },
  }), [enabled])
  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
}

export function useSound() { return useContext(SoundContext) }

export function SoundToggle() {
  const { enabled, toggle } = useSound()
  return (
    <button className="sound-toggle" type="button" aria-label="Sound" aria-pressed={enabled} onClick={toggle}>
      <span className="sound-bars" aria-hidden="true"><i /><i /><i /><i /></span>
      <span className="sound-label">Sound <b>{enabled ? 'on' : 'off'}</b></span>
    </button>
  )
}
