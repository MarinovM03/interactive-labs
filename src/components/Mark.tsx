export function Mark({ className = '' }: { className?: string }) {
  return (
    <svg className={`mark ${className}`} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect className="mark-plate" width="32" height="32" rx="4" />
      <path className="mark-crops" d="M7 13V7h6M25 19v6h-6" />
      <circle className="mark-point" cx="16" cy="16" r="3" />
    </svg>
  )
}
