import markUrl from '../assets/mark.svg'

export function Mark({ className = '' }: { className?: string }) {
  return <img className={`mark ${className}`} src={markUrl} alt="" width="32" height="32" decoding="async" draggable={false} />
}
