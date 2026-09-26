import type {
  CharacterModule,
} from '../data/database'

export default function CharacterModuleActions({
  module,
  onDelete,
}: {
  module: CharacterModule
  onDelete: (
    module: CharacterModule
  ) => void
}) {
  return (
    <div className="character-module-actions">
      <button
        type="button"
        className="destructive-button"
        onClick={() =>
          onDelete(module)
        }
      >
        Delete Module
      </button>
    </div>
  )
}