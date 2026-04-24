import type { CameraObject, ValorPlano } from '../types'
import {
  ALTURA_LABELS,
  ANGULACION_LABELS,
  VALOR_PLANO_LABELS,
} from '../types'

interface CameraPanelProps {
  camera: CameraObject
  onOpenPov?: () => void
  onPatch: (
    patch: Partial<
      Pick<
        CameraObject,
        | 'label'
        | 'showLabelOnCanvas'
        | 'fovDegrees'
        | 'showFovCone'
        | 'valorPlano'
        | 'altura'
        | 'angulacion'
      >
    >,
  ) => void
}

const valorPlanoOrder: ValorPlano[] = [
  'primerisimo_primer_plano',
  'plano_medio',
  'plano_americano',
  'plano_entero',
  'plano_conjunto',
  'plano_general',
  'gran_plano_general',
]

export function CameraPanel({ camera, onOpenPov, onPatch }: CameraPanelProps) {
  return (
    <aside className="camera-panel" aria-label="Ajustes de cámara">
      <h2 className="camera-panel__title">{camera.label}</h2>

      {onOpenPov ? (
        <div className="camera-panel__actions">
          <button type="button" className="btn" onClick={onOpenPov}>
            Ver en 3D desde esta cámara
          </button>
        </div>
      ) : null}

      <label className="field">
        <span className="field__label">Nombre</span>
        <input
          className="field__input"
          type="text"
          value={camera.label}
          onChange={(e) => onPatch({ label: e.target.value })}
        />
      </label>

      <label className="field field--row">
        <input
          type="checkbox"
          checked={camera.showLabelOnCanvas}
          onChange={(e) => onPatch({ showLabelOnCanvas: e.target.checked })}
        />
        <span>Mostrar el nombre en el canvas</span>
      </label>

      <label className="field field--row">
        <input
          type="checkbox"
          checked={camera.showFovCone}
          onChange={(e) => onPatch({ showFovCone: e.target.checked })}
        />
        <span>Activar visualización del radio de visión (grados)</span>
      </label>

      <label className="field">
        <span className="field__label">Radio de visión (FOV)</span>
        <div className="field__range">
          <input
            type="range"
            min={12}
            max={120}
            step={1}
            value={camera.fovDegrees}
            onChange={(e) => onPatch({ fovDegrees: Number(e.target.value) })}
          />
          <span className="field__mono">{camera.fovDegrees}°</span>
        </div>
      </label>

      <fieldset className="fieldset">
        <legend>Valor plano</legend>
        <select
          className="field__input"
          value={camera.valorPlano}
          onChange={(e) =>
            onPatch({ valorPlano: e.target.value as ValorPlano })
          }
        >
          {valorPlanoOrder.map((k) => (
            <option key={k} value={k}>
              {VALOR_PLANO_LABELS[k]}
            </option>
          ))}
        </select>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Altura</legend>
        <div className="radio-group">
          {(Object.keys(ALTURA_LABELS) as CameraObject['altura'][]).map(
            (k) => (
              <label key={k} className="radio">
                <input
                  type="radio"
                  name="altura"
                  checked={camera.altura === k}
                  onChange={() => onPatch({ altura: k })}
                />
                {ALTURA_LABELS[k]}
              </label>
            ),
          )}
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Angulación</legend>
        <div className="radio-group radio-group--stack">
          {(Object.keys(ANGULACION_LABELS) as CameraObject['angulacion'][]).map(
            (k) => (
              <label key={k} className="radio">
                <input
                  type="radio"
                  name="angulacion"
                  checked={camera.angulacion === k}
                  onChange={() => onPatch({ angulacion: k })}
                />
                {ANGULACION_LABELS[k]}
              </label>
            ),
          )}
        </div>
      </fieldset>
    </aside>
  )
}
