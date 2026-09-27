export function XLink({ className = '' }: { className?: string }) {
  return (
    <a className={`x-link ${className}`} href="https://x.com/marinovm10" target="_blank" rel="noopener noreferrer"
      aria-label="Marinov on X, @marinovm10 (opens in a new tab)">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93zm-1.29 19.5h2.04L6.49 3.24H4.3z" />
      </svg>
      <span className="x-handle">@marinovm10</span>
    </a>
  )
}
