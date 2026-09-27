import { pad } from '../data/labs'
import type { Lab } from '../data/labs'
import './Stats.css'

export function Stats({ labs }: { labs: Lab[] }) {
  const total = labs.length
  const misconceptions = labs.filter((lab) => lab.assumption.trim() && lab.reveal.trim()).length
  const live = labs.filter((lab) => lab.status === 'live').length
  return (
    <dl className="stats" aria-label="Index at a glance">
      <div className="stat">
        <dt>Labs</dt>
        <dd>{pad(total)}</dd>
      </div>
      <div className="stat">
        <dt>Misconceptions</dt>
        <dd>{pad(misconceptions)}</dd>
      </div>
      <div className={`stat${live ? ' is-live' : ''}`}>
        <dt>Paths live</dt>
        <dd>
          <span aria-hidden="true">{pad(live)}<small>/{pad(total)}</small></span>
          <span className="sr-only">{live} of {total}</span>
        </dd>
      </div>
    </dl>
  )
}
