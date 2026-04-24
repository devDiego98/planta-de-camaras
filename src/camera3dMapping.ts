import type { Angulacion, AlturaCamara, CameraObject } from './types'

export function wallHeight(roomW: number, roomH: number): number {
  const m = Math.min(roomW, roomH)
  return Math.max(m * 0.22, 12)
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

export function eyeHeightY(
  camera: CameraObject,
  roomW: number,
  roomH: number,
): number {
  const base = Math.min(roomW, roomH)
  const map: Record<AlturaCamara, number> = {
    alta: 0.11 * base,
    normal: 0.075 * base,
    baja: 0.042 * base,
  }
  return map[camera.altura]
}

/** Pitch for eye-level shots (normal / contra_picado). */
function pitchFromAngulacionEyeLevel(a: Angulacion): number {
  const deg: Partial<Record<Angulacion, number>> = {
    normal: -8,
    contra_picado: 16,
  }
  const d = deg[a] ?? -8
  return (d * Math.PI) / 180
}

export interface PovVec3 {
  x: number
  y: number
  z: number
}

/**
 * Camera position and orbit target for the 3D POV modal.
 * Cenital / picado use a high camera looking at the floor so the target
 * never ends up under the room (which broke the view with the old ray math).
 */
export function computePovPose(
  cam: CameraObject,
  roomW: number,
  roomH: number,
): { position: PovVec3; target: PovVec3 } {
  const px = cam.x
  const pz = cam.y
  const yaw = (cam.rotation * Math.PI) / 180
  const cosYaw = Math.cos(yaw)
  const sinYaw = Math.sin(yaw)
  const wh = wallHeight(roomW, roomH)
  const base = Math.min(roomW, roomH)
  const maxDim = Math.max(roomW, roomH)
  const eyeY = eyeHeightY(cam, roomW, roomH)

  if (cam.angulacion === 'cenital') {
    const lift = maxDim * 0.62 + wh * 1.05
    return {
      position: { x: px, y: lift, z: pz },
      target: {
        x: clamp(px, roomW * 0.12, roomW * 0.88),
        y: 0.06,
        z: clamp(pz, roomH * 0.12, roomH * 0.88),
      },
    }
  }

  if (cam.angulacion === 'picado') {
    const lift = wh * 1.05 + base * 0.38
    const reach = base * 0.58
    return {
      position: {
        x: clamp(px - cosYaw * reach * 0.1, 4, roomW - 4),
        y: lift,
        z: clamp(pz - sinYaw * reach * 0.1, 4, roomH - 4),
      },
      target: {
        x: clamp(px + cosYaw * reach, 4, roomW - 4),
        y: 0.08,
        z: clamp(pz + sinYaw * reach, 4, roomH - 4),
      },
    }
  }

  if (cam.angulacion === 'nadir') {
    const yLow = Math.max(0.1, wh * 0.06)
    return {
      position: { x: px, y: yLow, z: pz },
      target: {
        x: px,
        y: Math.min(wh * 1.25, eyeY + base * 0.35),
        z: pz,
      },
    }
  }

  const pitch = pitchFromAngulacionEyeLevel(cam.angulacion)
  const fx = cosYaw * Math.cos(pitch)
  const fy = Math.sin(pitch)
  const fz = sinYaw * Math.cos(pitch)

  const dist = base * 0.52
  let tx = px + fx * dist
  let ty = eyeY + fy * dist
  let tz = pz + fz * dist

  if (fy < -0.06) {
    const tHit = -eyeY / fy
    if (tHit > 0.04 && tHit < base * 10) {
      tx = px + fx * tHit
      tz = pz + fz * tHit
      ty = 0.08
    }
  }

  tx = clamp(tx, 3, roomW - 3)
  tz = clamp(tz, 3, roomH - 3)
  ty = clamp(ty, 0.06, wh * 1.35)

  const back = base * 0.026
  return {
    position: {
      x: clamp(px - fx * back, 2, roomW - 2),
      y: clamp(eyeY - fy * back, wh * 0.03, wh * 2.4),
      z: clamp(pz - fz * back, 2, roomH - 2),
    },
    target: { x: tx, y: ty, z: tz },
  }
}
