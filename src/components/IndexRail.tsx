import type { ReactNode } from 'react'
import { Mark } from './Mark'
import { XLink } from './XLink'
import { SoundToggle } from '../audio/Sound'

export function IndexRail({ children }: { children?: ReactNode }) {
  return (
    <header className="rail">
      <div className="rail-top">
        <a className="lockup" href="/" aria-label="Interactive Labs by Marinov, home">
          <Mark />
          <span>Marinov</span>
        </a>
        <div className="rail-actions">
          <XLink />
          <SoundToggle />
        </div>
      </div>

      <div className="rail-hero">
        <h1 className="display">
          <span className="display-line"><span>Interactive</span></span>{' '}
          <span className="display-line"><span>Labs <span className="display-by">by Marinov</span></span></span>
        </h1>
        <p className="lede"><strong>Playable 3D explainers.</strong> Each one makes a single misconception visible.</p>
      </div>

      {children}
    </header>
  )
}
