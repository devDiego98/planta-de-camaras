import { lazy, Suspense, useEffect } from 'react'
import type { CameraObject, FloorObject } from '../types'

const FloorScene3DCanvas = lazy(async () => {
  const m = await import('./FloorScene3D')
  return { default: m.FloorScene3DCanvas }
})

interface CameraPovModalProps {
  open: boolean
  povCamera: CameraObject | null
  roomWidth: number
  roomHeight: number
  objects: FloorObject[]
  onClose: () => void
}

export function CameraPovModal({
  open,
  povCamera,
  roomWidth,
  roomHeight,
  objects,
  onClose,
}: CameraPovModalProps) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !povCamera) return null

  return (
    <div
      className="pov-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pov-modal-title"
    >
      <button
        type="button"
        className="pov-modal__backdrop"
        aria-label="Cerrar vista 3D"
        onClick={onClose}
      />
      <div className="pov-modal__panel">
        <header className="pov-modal__header">
          <h2 id="pov-modal-title" className="pov-modal__title">
            Vista 3D — {povCamera.label}
          </h2>
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Cerrar
          </button>
        </header>
        <p className="pov-modal__hint">
          Arrastra para girar la vista alrededor del punto de mira; la rueda del
          ratón acerca o aleja; clic derecho o Mayús+arrastrar desplaza la
          cámara.
        </p>
        <div className="pov-modal__canvas-wrap">
          <Suspense
            fallback={
              <div className="pov-modal__loading" role="status">
                Cargando escena 3D…
              </div>
            }
          >
            <FloorScene3DCanvas
              roomWidth={roomWidth}
              roomHeight={roomHeight}
              objects={objects}
              povCamera={povCamera}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
