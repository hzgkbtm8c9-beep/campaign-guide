export type SaveStatusState =
  | 'saved'
  | 'saving'
  | 'error'

export function SaveStatus({
  status,
  className = '',
}: {
  status: SaveStatusState
  className?: string
}) {
  const text =
    status === 'saving'
      ? 'Saving…'
      : status === 'error'
        ? 'Save error'
        : 'Saved'

  return (
    <span
      className={`save-status ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      {text}
    </span>
  )
}