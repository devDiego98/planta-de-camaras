import type { PersonObject } from '../types'

interface PersonObjectPanelProps {
  object: PersonObject
  onPatch: (
    patch: Partial<Pick<PersonObject, 'name' | 'showNameOnCanvas'>>,
  ) => void
}

export function PersonObjectPanel({ object, onPatch }: PersonObjectPanelProps) {
  return (
    <aside className="camera-panel generic-panel" aria-label="Persona">
      <h2 className="camera-panel__title">Persona</h2>

      <label className="field">
        <span className="field__label">Nombre</span>
        <input
          className="field__input"
          type="text"
          value={object.name}
          onChange={(e) => onPatch({ name: e.target.value })}
          placeholder="Ej. actor, extra…"
        />
      </label>

      <label className="field field--row">
        <input
          type="checkbox"
          checked={object.showNameOnCanvas}
          onChange={(e) => onPatch({ showNameOnCanvas: e.target.checked })}
        />
        <span>Mostrar el nombre debajo de la figura en el canvas</span>
      </label>
    </aside>
  )
}
