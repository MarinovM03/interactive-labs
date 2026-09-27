export function Mark({ className = '' }: { className?: string }) {
  return <img className={`mark ${className}`} src="/favicon.svg?v=2" alt="" width="32" height="32" decoding="async" draggable={false} />
}
