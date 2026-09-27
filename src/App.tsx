import { useEffect, useState } from 'react'
import { labs } from './data/labs'
import { IndexRail } from './components/IndexRail'
import { LabIndex, matches } from './components/LabIndex'
import type { Filter } from './components/LabIndex'
import { LabPlate } from './components/LabPlate'
import { Mark } from './components/Mark'
import { Stats } from './components/Stats'
import { SoundProvider, useSound } from './audio/Sound'
import { useMediaQuery } from './hooks/useMediaQuery'

const labFromHash = () => labs.find((lab) => `#${lab.id}` === window.location.hash)?.id
// replaceState keeps each lab linkable without filling the back button with every row visited.
const markHash = (id: string) => { try { history.replaceState(null, '', `#${id}`) } catch { /* Linking is optional. */ } }

export function App() {
  return <SoundProvider><Hub /></SoundProvider>
}

function Hub() {
  const wide = useMediaQuery('(min-width: 960px)')
  const sound = useSound()
  const [filter, setFilter] = useState<Filter>('all')
  const [selectedId, setSelectedId] = useState(() => labFromHash() ?? labs[0].id)
  const [expanded, setExpanded] = useState(() => new Set([labFromHash() ?? labs[0].id]))
  const visible = labs.filter(matches(filter))
  const selected = visible.find((lab) => lab.id === selectedId) ?? visible[0] ?? labs[0]
  const position = visible.indexOf(selected)
  const liveCount = labs.filter((lab) => lab.status === 'live').length

  useEffect(() => {
    const onHash = () => {
      const id = labFromHash()
      if (!id) return
      setFilter('all')
      setSelectedId(id)
      setExpanded((open) => new Set(open).add(id))
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  function select(id: string, via: 'pointer' | 'key') {
    setSelectedId(id)
    markHash(id)
    sound.play(via === 'key' ? 'detent' : 'click')
  }

  function toggle(id: string) {
    const opening = !expanded.has(id)
    setExpanded((open) => {
      const next = new Set(open)
      if (opening) next.add(id)
      else next.delete(id)
      return next
    })
    if (opening) markHash(id)
    sound.play('click')
  }

  function changeFilter(next: Filter) {
    setFilter(next)
    // If the filter hides the current lab, the first visible one takes over, and the link follows it.
    const shown = labs.filter(matches(next))
    if (!shown.some((lab) => lab.id === selected.id) && shown[0]) {
      setSelectedId(shown[0].id)
      markHash(shown[0].id)
    }
    sound.play('click')
  }

  const index = (
    <LabIndex labs={labs} filter={filter} onFilter={changeFilter} mode={wide ? 'tabs' : 'disclosure'}
      selectedId={selected.id} onSelect={select} expanded={expanded} onToggle={toggle}
      renderPanel={(lab) => <LabPlate lab={lab} number={labs.indexOf(lab) + 1} total={labs.length} compact />} />
  )

  return (
    <>
      <a className="skip-link" href="#index">Skip to the lab index</a>
      <div className="split">
        <IndexRail>
          {wide ? (
            <>
              {index}
              <p className="rail-legend" aria-hidden="true">↑ ↓ browse the index · the plate follows</p>
            </>
          ) : <Stats labs={labs} />}
        </IndexRail>

        <main className="stage" id="labs">
          {wide ? (
            <>
              <Stats labs={labs} />
              <section className="stage-panel" role="tabpanel" id="lab-panel" aria-labelledby={selected.id} tabIndex={0}>
                <LabPlate lab={selected} number={labs.indexOf(selected) + 1} total={labs.length}
                  step={{
                    prev: position > 0,
                    next: position < visible.length - 1,
                    go: (direction) => { const target = visible[position + direction]; if (target) select(target.id, 'pointer') },
                  }} />
              </section>
            </>
          ) : index}
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
          <p className="colophon-year">© {new Date().getFullYear()} Marinov</p>
        </div>
      </footer>
    </>
  )
}
