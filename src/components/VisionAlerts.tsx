import type { VisionConflict } from '../fov'

interface VisionAlertsProps {
  conflicts: VisionConflict[]
}

export function VisionAlerts({ conflicts }: VisionAlertsProps) {
  if (conflicts.length === 0) {
    return (
      <div className="vision-alerts vision-alerts--ok" role="status">
        Ningún borde de cámara entra en el radio de visión de otra.
      </div>
    )
  }

  return (
    <div className="vision-alerts vision-alerts--warn" role="alert">
      <strong className="vision-alerts__heading">Conflictos de visión</strong>
      <ul className="vision-alerts__list">
        {conflicts.map((c) => (
          <li key={`${c.observerId}-${c.targetId}`}>
            {c.targetLabel} está en visión de {c.observerLabel}.
          </li>
        ))}
      </ul>
    </div>
  )
}
