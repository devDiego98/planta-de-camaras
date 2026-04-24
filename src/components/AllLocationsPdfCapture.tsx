import { forwardRef } from 'react'
import { FloorCanvas } from './FloorCanvas'
import type { FloorObject, Location } from '../types'
import {
  ALTURA_LABELS,
  ANGULACION_LABELS,
  VALOR_PLANO_LABELS,
  isCamera,
} from '../types'

const noopSelect = () => {}
const noopPatch = (_id: string, _patch: Partial<FloorObject>) => {}

export const AllLocationsPdfCapture = forwardRef<HTMLDivElement, { locations: Location[] }>(
  function AllLocationsPdfCapture({ locations }, ref) {
    return (
      <div ref={ref} className="pdf-capture-root" aria-hidden>
        <h1 className="pdf-capture-title">Planta de cámaras — todas las locaciones</h1>
        {locations.map((loc) => {
          const cameras = loc.objects.filter(isCamera)
          return (
            <section key={loc.id} className="pdf-capture-location">
              <h2 className="pdf-capture-location-name">{loc.name}</h2>
              <div className="pdf-capture-row">
                <div className="pdf-capture-canvas-wrap">
                  <FloorCanvas
                    width={loc.width}
                    height={loc.height}
                    objects={loc.objects}
                    selectedId={null}
                    onSelect={noopSelect}
                    onPatchObject={noopPatch}
                  />
                </div>
                <div className="pdf-capture-details">
                  {cameras.length === 0 ? (
                    <p className="pdf-capture-empty">No hay cámaras en esta locación.</p>
                  ) : (
                    <table className="pdf-capture-table">
                      <thead>
                        <tr>
                          <th>Cámara</th>
                          <th>Valor plano</th>
                          <th>Altura</th>
                          <th>Angulación</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cameras.map((cam) => (
                          <tr key={cam.id}>
                            <td>{cam.label.trim() || '—'}</td>
                            <td>{VALOR_PLANO_LABELS[cam.valorPlano]}</td>
                            <td>{ALTURA_LABELS[cam.altura]}</td>
                            <td>{ANGULACION_LABELS[cam.angulacion]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </section>
          )
        })}
      </div>
    )
  },
)
