import type { GenericObject } from '../types'

interface GenericObjectPanelProps {
  object: GenericObject
  onPatch: (
    patch: Partial<
      Pick<
        GenericObject,
        | 'name'
        | 'note'
        | 'boxWidth'
        | 'boxHeight'
        | 'showNameOnCanvas'
      >
    >,
  ) => void
}

export function GenericObjectPanel({ object, onPatch }: GenericObjectPanelProps) {
  return (
    <aside className="camera-panel generic-panel" aria-label="Objeto genérico">
      <h2 className="camera-panel__title">Objeto genérico</h2>

      <label className="field">
        <span className="field__label">Nombre</span>
        <input
          className="field__input"
          type="text"
          value={object.name}
          onChange={(e) => onPatch({ name: e.target.value })}
        />
      </label>

      <label className="field">
        <span className="field__label">Nota</span>
        <textarea
          className="field__input field__textarea"
          rows={4}
          value={object.note}
          onChange={(e) => onPatch({ note: e.target.value })}
        />
      </label>

      <label className="field">
        <span className="field__label">Ancho (px)</span>
        <input
          className="field__input"
          type="number"
          min={20}
          max={2000}
          step={1}
          value={Math.round(object.boxWidth)}
          onChange={(e) => {
            const v = Number(e.target.value)
            if (Number.isFinite(v)) onPatch({ boxWidth: Math.max(20, v) })
          }}
        />
      </label>

      <label className="field">
        <span className="field__label">Alto (px)</span>
        <input
          className="field__input"
          type="number"
          min={20}
          max={2000}
          step={1}
          value={Math.round(object.boxHeight)}
          onChange={(e) => {
            const v = Number(e.target.value)
            if (Number.isFinite(v)) onPatch({ boxHeight: Math.max(20, v) })
          }}
        />
      </label>

      <label className="field field--row">
        <input
          type="checkbox"
          checked={object.showNameOnCanvas}
          onChange={(e) => onPatch({ showNameOnCanvas: e.target.checked })}
        />
        <span>Mostrar el nombre en el centro del rectángulo</span>
      </label>
    </aside>
  )
}
