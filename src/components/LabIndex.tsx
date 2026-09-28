import type { KeyboardEvent } from 'react'
import { pad } from '../data/labs'
import type { Lab } from '../data/labs'
import { LabPlate } from './LabPlate'
import './LabIndex.css'

export type Filter = 'all' | 'live' | 'soon'

type Props = {
  labs: Lab[]
  filter: Filter
  onFilter: (filter: Filter) => void
  onStep: () => void
}

const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'live', label: 'Live' },
  { id: 'soon', label: 'Soon' },
]

const matches = (filter: Filter) => (lab: Lab) => filter === 'all' || lab.status === filter

export function LabIndex({ labs, filter, onFilter, onStep }: Props) {
  const visible = labs.filter(matches(filter))
  const counts: Record<Filter, number> = {
    all: labs.length,
    live: labs.filter(matches('live')).length,
    soon: labs.filter(matches('soon')).length,
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const grid = event.currentTarget
    const cards = [...grid.querySelectorAll<HTMLElement>(':scope > .plate')]
    const current = cards.findIndex((card) => card.contains(event.target as Node))
    if (current < 0) return
    const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').length
    const moves: Record<string, number> = {
      ArrowRight: current + 1,
      ArrowLeft: current - 1,
      ArrowDown: current + columns,
      ArrowUp: current - columns,
      PageDown: current + 1,
      PageUp: current - 1,
      Home: 0,
      End: cards.length - 1,
    }
    if (!(event.key in moves)) return
    event.preventDefault()
    const target = cards[Math.min(cards.length - 1, Math.max(0, moves[event.key]))]
    if (target === cards[current]) return
    ;(target.querySelector<HTMLElement>('.plate-open') ?? target).focus()
    onStep()
  }

  return (
    <section className="index" id="index" aria-labelledby="index-label">
      <div className="index-head">
        <h2 className="index-label" id="index-label">
          Index<span>{pad(labs.length)} {labs.length === 1 ? 'lab' : 'labs'}</span>
        </h2>
        <fieldset className="index-filters">
          <legend className="sr-only">Show labs by status</legend>
          {filters.map(({ id, label }) => (
            <button key={id} type="button" className="chip" aria-pressed={filter === id}
              disabled={counts[id] === 0 && filter !== id} onClick={() => onFilter(id)}>
              {label}<span className="chip-count">{pad(counts[id])}</span>
            </button>
          ))}
        </fieldset>
      </div>

      {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the feed pattern handles its keys on the container */}
      <div className="index-grid" role="feed" aria-busy="false" aria-labelledby="index-label" onKeyDown={onKeyDown}>
        {visible.map((lab, index) => (
          <LabPlate key={lab.id} lab={lab} number={labs.indexOf(lab) + 1} position={index + 1} setSize={visible.length} />
        ))}
      </div>
    </section>
  )
}
