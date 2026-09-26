import Modal from './Modal'

export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Delete',
  isConfirming = false,
  onConfirm,
  onCancel,
}: {
  title: string
  message: string
  confirmLabel?: string
  isConfirming?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Modal
      onClose={() => {
        if (!isConfirming) {
          onCancel()
        }
      }}
    >
      <h2 className="modal-title">
        {title}
      </h2>

      <p>
        {message}
      </p>

      <div className="modal-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={onCancel}
          disabled={isConfirming}
        >
          Cancel
        </button>

        <button
          type="button"
          className="destructive-button"
          onClick={onConfirm}
          disabled={isConfirming}
        >
          {isConfirming
            ? 'Deleting…'
            : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}