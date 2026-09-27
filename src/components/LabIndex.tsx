import { useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { pad } from '../data/labs'
import type { Lab } from '../data/labs'
import './LabIndex.css'

export type Filter = 'all' | 'live' | 'soon'

type Props = {
  labs: Lab[]
  filter: Filter
  onFilter: (filter: Filter) => void
  /** Desktop: a vertical tab list driving one plate. Mobile: rows that open in place. */
  mode: 'tabs' | 'disclosure'
  selectedId: string
  onSelect: (id: string, via: 'pointer' | 'key') => void
  expanded: Set<string>
  onToggle: (id: string) => void
  renderPanel: (lab: Lab) => ReactNode
}

const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'live', label: 'Live' },
  { id: 'soon', label: 'Soon' },
]

export const matches = (filter: Filter) => (lab: Lab) => filter === 'all' || lab.status === filter

export function LabIndex({ labs, filter, onFilter, mode, selectedId, onSelect, expanded, onToggle, renderPanel }: Props) {
  const visible = labs.filter(matches(filter))
  const counts: Record<Filter, number> = {
    all: labs.length,
    live: labs.filter(matches('live')).length,
    soon: labs.filter(matches('soon')).length,
  }

  // Arrow keys walk the visible rows. In tab mode moving also selects, per the tab pattern.
  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    const ids = visible.map((lab) => lab.id)
    const current = ids.indexOf((event.target as HTMLElement).dataset.lab ?? '')
    if (current < 0) return
    const last = ids.length - 1
    const next = { ArrowDown: current === last ? 0 : current + 1, ArrowUp: current === 0 ? last : current - 1, Home: 0, End: last }[event.key]
    if (next === undefined) return
    event.preventDefault()
    const target = event.currentTarget.querySelector<HTMLElement>(`[data-lab="${ids[next]}"]`)
    target?.focus()
    if (mode === 'tabs' && next !== current) onSelect(ids[next], 'key')
  }

  return (
    <nav className={`index index--${mode}`} id="index" aria-label="Lab index">
      <div className="index-head">
        <p className="index-label"><span>Index</span><span>{pad(labs.length)} {labs.length === 1 ? 'lab' : 'labs'}</span></p>
        <div className="index-filters" role="group" aria-label="Show labs by status">
          {filters.map(({ id, label }) => (
            <button key={id} type="button" className="chip" aria-pressed={filter === id}
              disabled={counts[id] === 0 && filter !== id} onClick={() => onFilter(id)}>
              {label}<span className="chip-count">{pad(counts[id])}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="index-scroll">
        {mode === 'tabs'
          ? <TabRows visible={visible} all={labs} selectedId={selectedId} onSelect={onSelect} onKeyDown={onKeyDown} />
          : (
            <ol className="index-list" onKeyDown={onKeyDown}>
              {visible.map((lab) => {
                const open = expanded.has(lab.id)
                return (
                  <li key={lab.id} className={`index-item${open ? ' is-open' : ''}`}>
                    <h2 className="index-heading">
                      <button type="button" className="index-row" id={lab.id} data-lab={lab.id}
                        aria-expanded={open} aria-controls={`${lab.id}-panel`} aria-label={rowLabel(lab)}
                        onClick={() => onToggle(lab.id)}>
                        <RowBody lab={lab} number={labs.indexOf(lab) + 1} />
                        <span className="index-toggle" aria-hidden="true" />
                      </button>
                    </h2>
                    <div className="index-panel" id={`${lab.id}-panel`} hidden={!open}>
                      {open && renderPanel(lab)}
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
      </div>
    </nav>
  )
}

function TabRows({ visible, all, selectedId, onSelect, onKeyDown }: {
  visible: Lab[]
  all: Lab[]
  selectedId: string
  onSelect: (id: string, via: 'pointer' | 'key') => void
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void
}) {
  const list = useRef<HTMLDivElement>(null)
  const [marker, setMarker] = useState<{ top: number; height: number } | null>(null)

  // One marker travels between rows so the eye follows the change.
  useLayoutEffect(() => {
    const element = list.current
    if (!element) return
    const measure = () => {
      const row = element.querySelector<HTMLElement>(`[data-lab="${selectedId}"]`)
      setMarker(row ? { top: row.offsetTop, height: row.offsetHeight } : null)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [selectedId, visible.length])

  return (
    <div className="index-tabs" role="tablist" aria-orientation="vertical" aria-label="Labs" ref={list} onKeyDown={onKeyDown}>
      {visible.map((lab) => {
        const selected = lab.id === selectedId
        return (
          <button key={lab.id} type="button" role="tab" className="index-row" id={lab.id} data-lab={lab.id}
            aria-selected={selected} aria-controls="lab-panel" tabIndex={selected ? 0 : -1} aria-label={rowLabel(lab)}
            onClick={() => { if (!selected) onSelect(lab.id, 'pointer') }}>
            <RowBody lab={lab} number={all.indexOf(lab) + 1} />
          </button>
        )
      })}
      {marker && <span className="index-marker" aria-hidden="true" style={{ transform: `translateY(${marker.top}px)`, height: marker.height }} />}
    </div>
  )
}

const rowLabel = (lab: Lab) => `${lab.title}, ${lab.category}. ${lab.status === 'live' ? 'Live' : 'Coming soon'}.`

function RowBody({ lab, number }: { lab: Lab; number: number }) {
  return (
    <>
      <span className="index-no">{pad(number)}</span>
      <span className="index-thumb">
        <img src={lab.media.thumb ?? lab.media.poster} alt="" width="240" height="150" loading="lazy" decoding="async" draggable={false} />
      </span>
      <span className="index-name">
        <span className="index-title">{lab.title}</span>
        <span className="index-cat">{lab.category}</span>
      </span>
      <span className="index-status" data-status={lab.status}><i />{lab.status === 'live' ? 'Live' : 'Soon'}</span>
    </>
  )
}
