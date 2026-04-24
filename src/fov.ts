import type { CameraObject } from './types'

const RAD = Math.PI / 180

/**
 * Contorno exterior del icono de cámara en el canvas (coords locales antes de
 * translate/rotate). Debe coincidir con `CameraShape` en FloorCanvas.tsx.
 */
const CAMERA_FOOTPRINT_LOCAL: ReadonlyArray<readonly [number, number]> = [
  [-22, -14],
  [14, -14],
  [14, -12],
  [28, -3],
  [14, 6],
  [14, 8],
  [-22, 8],
]

/** Máx. longitud de subsegmento al muestrear bordes (unidades SVG). */
const FOOTPRINT_SAMPLE_STEP = 3

function localPointToWorld(
  lx: number,
  ly: number,
  cx: number,
  cy: number,
  rotationDeg: number,
): [number, number] {
  const r = rotationDeg * RAD
  const cos = Math.cos(r)
  const sin = Math.sin(r)
  return [cx + lx * cos - ly * sin, cy + lx * sin + ly * cos]
}

/** Puntos a lo largo del perímetro del icono de cámara en coords. mundo. */
function worldSamplesOnCameraFootprint(cam: CameraObject): Array<[number, number]> {
  const verts = CAMERA_FOOTPRINT_LOCAL
  const out: Array<[number, number]> = []
  const n = verts.length
  for (let i = 0; i < n; i++) {
    const [ax, ay] = verts[i]!
    const [bx, by] = verts[(i + 1) % n]!
    const [wax, way] = localPointToWorld(ax, ay, cam.x, cam.y, cam.rotation)
    const [wbx, wby] = localPointToWorld(bx, by, cam.x, cam.y, cam.rotation)
    const len = Math.hypot(wbx - wax, wby - way)
    const steps = Math.max(1, Math.ceil(len / FOOTPRINT_SAMPLE_STEP))
    for (let s = 0; s < steps; s++) {
      const t = s / steps
      out.push([wax + t * (wbx - wax), way + t * (wby - way)])
    }
  }
  return out
}

/** True si algún punto del borde del icono de `target` entra en el cono de `observer`. */
export function isCameraFootprintInObserverFov(
  target: CameraObject,
  observer: Pick<CameraObject, 'x' | 'y' | 'rotation' | 'fovDegrees'>,
  maxRange: number,
): boolean {
  for (const [px, py] of worldSamplesOnCameraFootprint(target)) {
    if (isPointInCameraFov(px, py, observer, maxRange)) return true
  }
  return false
}

function normalizeAngleRad(a: number): number {
  let x = a
  while (x > Math.PI) x -= 2 * Math.PI
  while (x < -Math.PI) x += 2 * Math.PI
  return x
}

/**
 * Comprueba si el punto (px, py) está dentro del sector de visión de la cámara.
 * rotationDeg: dirección del eje óptico en grados (0 = +X, horario positivo).
 */
export function isPointInCameraFov(
  px: number,
  py: number,
  cam: Pick<CameraObject, 'x' | 'y' | 'rotation' | 'fovDegrees'>,
  maxRange: number,
): boolean {
  const dx = px - cam.x
  const dy = py - cam.y
  const dist = Math.hypot(dx, dy)
  if (dist < 1e-3 || dist > maxRange) return false
  const aim = cam.rotation * RAD
  const angle = Math.atan2(dy, dx)
  const half = (cam.fovDegrees / 2) * RAD
  const diff = normalizeAngleRad(angle - aim)
  return Math.abs(diff) <= half + 1e-6
}

export interface VisionConflict {
  /** Cámara cuyo icono (borde) interseca el cono de visión del observador. */
  targetLabel: string
  targetId: string
  /** Cámara que “ve” a la otra. */
  observerLabel: string
  observerId: string
}

export function computeVisionConflicts(
  cameras: CameraObject[],
  maxRange: number,
): VisionConflict[] {
  const out: VisionConflict[] = []
  for (const observer of cameras) {
    for (const target of cameras) {
      if (target.id === observer.id) continue
      if (isCameraFootprintInObserverFov(target, observer, maxRange)) {
        out.push({
          targetLabel: target.label,
          targetId: target.id,
          observerLabel: observer.label,
          observerId: observer.id,
        })
      }
    }
  }
  return out
}

export function fovSectorPath(
  cx: number,
  cy: number,
  rotationDeg: number,
  fovDeg: number,
  radius: number,
): string {
  const aim = rotationDeg * RAD
  const half = (fovDeg / 2) * RAD
  const a0 = aim - half
  const a1 = aim + half
  const x0 = cx + Math.cos(a0) * radius
  const y0 = cy + Math.sin(a0) * radius
  const x1 = cx + Math.cos(a1) * radius
  const y1 = cy + Math.sin(a1) * radius
  const largeArc = fovDeg > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${x0} ${y0} A ${radius} ${radius} 0 ${largeArc} 1 ${x1} ${y1} Z`
}
