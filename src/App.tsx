import { useState } from 'react'
import { labs } from './data/labs'
import { IndexRail } from './components/IndexRail'
import { LabIndex } from './components/LabIndex'
import type { Filter } from './components/LabIndex'
import { Mark } from './components/Mark'
import { Stats } from './components/Stats'
import { XLink } from './components/XLink'
import { SoundProvider, useSound } from './audio/Sound'

export function App() {
  return <SoundProvider><Hub /></SoundProvider>
}

function Hub() {
  const sound = useSound()
  const [filter, setFilter] = useState<Filter>('all')
  const liveCount = labs.filter((lab) => lab.status === 'live').length

  return (
    <>
      <a className="skip-link" href="#index">Skip to the lab index</a>
      <div className="split">
        <IndexRail>
          <div className="rail-foot">
            <Stats labs={labs} />
            <p className="rail-legend" aria-hidden="true">Tab or arrow keys move through the cards</p>
          </div>
        </IndexRail>

        <main className="stage">
          <LabIndex labs={labs} filter={filter}
            onFilter={(next) => { setFilter(next); sound.play('click') }}
            onStep={() => sound.play('detent')} />
        </main>
      </div>

      <footer className="colophon">
        <div className="colophon-inner">
          <div className="colophon-mark">
            <Mark />
            <p><strong>Interactive Labs</strong> by Marinov</p>
          </div>
          <p className="colophon-note">
            Each lab is its own app at its own address. This page is only the index.
            {' '}{liveCount ? `${liveCount} of ${labs.length} open now.` : 'None are open yet; each opens once its path is mounted.'}
          </p>
          <p className="colophon-year">
            <span>© {new Date().getFullYear()} Marinov</span>
            <XLink className="x-link--night" />
          </p>
        </div>
      </footer>
    </>
  )
}
