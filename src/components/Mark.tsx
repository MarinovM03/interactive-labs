export function Mark({ className = '' }: { className?: string }) {
  return <img className={`mark ${className}`} src="/favicon.svg" alt="" width="32" height="32" decoding="async" draggable={false} />
}
