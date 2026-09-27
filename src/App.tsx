import { useState } from 'react'
import { labs } from './data/labs'
import { IndexRail } from './components/IndexRail'
import { LabPlate } from './components/LabPlate'
import { Mark } from './components/Mark'
import { SoundProvider } from './audio/Sound'
import { useScrollSpy } from './hooks/useScrollSpy'

export function App() {
  const [activeId, setActiveId] = useScrollSpy(labs.map((lab) => lab.id))
  const [cuedId, setCuedId] = useState<string | null>(null)
  const liveCount = labs.filter((lab) => lab.status === 'live').length

  return (
    <SoundProvider>
      <a className="skip-link" href="#labs">Skip to labs</a>
      <div className="split">
        <IndexRail labs={labs} activeId={activeId} cuedId={cuedId} onCue={setCuedId} onJump={setActiveId} />
        <main className="plates" id="labs" tabIndex={-1} aria-label="Labs">
          {labs.map((lab, index) => (
            <LabPlate key={lab.id} lab={lab} index={index} cued={cuedId === lab.id} onCue={setCuedId} />
          ))}
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
            {' '}{liveCount ? `${liveCount} of ${labs.length} open now.` : 'None are open yet.'}
          </p>
          <p className="colophon-year">© {new Date().getFullYear()} Marinov</p>
        </div>
      </footer>
    </SoundProvider>
  )
}
