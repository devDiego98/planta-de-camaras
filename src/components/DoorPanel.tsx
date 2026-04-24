import type { DoorObject } from '../types'

interface DoorPanelProps {
  door: DoorObject
  onPatch: (patch: Partial<Pick<DoorObject, 'opensClockwise'>>) => void
}

export function DoorPanel({ door, onPatch }: DoorPanelProps) {
  return (
    <aside className="camera-panel" aria-label="Puerta">
      <h2 className="camera-panel__title">Puerta</h2>
      <fieldset className="fieldset">
        <legend>Sentido de apertura (vista en planta)</legend>
        <div className="radio-group radio-group--stack">
          <label className="radio">
            <input
              type="radio"
              name={`door-swing-${door.id}`}
              checked={door.opensClockwise}
              onChange={() => onPatch({ opensClockwise: true })}
            />
            Horario
          </label>
          <label className="radio">
            <input
              type="radio"
              name={`door-swing-${door.id}`}
              checked={!door.opensClockwise}
              onChange={() => onPatch({ opensClockwise: false })}
            />
            Antihorario
          </label>
        </div>
      </fieldset>
    </aside>
  )
}
