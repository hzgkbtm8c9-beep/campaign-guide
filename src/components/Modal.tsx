import {
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

export default function Modal({
  children,
  onClose,
  className = 'standard-modal',
}: {
  children: ReactNode
  onClose?: () => void
  className?: string
}) {
  const modalHost =
    document.getElementById(
      'modal-host'
    )

  if (!modalHost) {
    return null
  }

  return createPortal(
    <div
      className="modal-backdrop"
      onClick={onClose}
    >
      <div
        className={className}
        role="dialog"
        aria-modal="true"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {children}
      </div>
    </div>,
    modalHost
  )
}