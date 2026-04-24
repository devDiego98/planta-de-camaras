/** Mitad del vano en el eje largo de la puerta (coincide con DoorShape). */
export const DOOR_HALF_LENGTH = 20
/** Mitad del espesor del marco en el eje corto. */
export const DOOR_HALF_THICK = 4

export function snapDoorToNearestWall(
  x: number,
  y: number,
  roomW: number,
  roomH: number,
): { x: number; y: number; rotation: number } {
  const hl = DOOR_HALF_LENGTH
  const ht = DOOR_HALF_THICK
  const minX = Math.min(hl, roomW / 2)
  const maxX = Math.max(roomW - hl, roomW / 2)
  const minY = Math.min(hl, roomH / 2)
  const maxY = Math.max(roomH - hl, roomH / 2)

  type Cand = { x: number; y: number; rotation: number; d: number; tie: number }
  const cands: Cand[] = [
    {
      x: clamp(x, minX, maxX),
      y: roomH - ht,
      rotation: 0,
      d: 0,
      tie: 0,
    },
    {
      x: clamp(x, minX, maxX),
      y: ht,
      rotation: 180,
      d: 0,
      tie: 1,
    },
    {
      x: ht,
      y: clamp(y, minY, maxY),
      rotation: 90,
      d: 0,
      tie: 2,
    },
    {
      x: roomW - ht,
      y: clamp(y, minY, maxY),
      rotation: -90,
      d: 0,
      tie: 3,
    },
  ]

  for (const c of cands) {
    c.d = Math.hypot(x - c.x, y - c.y)
  }

  cands.sort((a, b) => {
    if (Math.abs(a.d - b.d) > 1e-6) return a.d - b.d
    return a.tie - b.tie
  })

  const best = cands[0]!
  return { x: best.x, y: best.y, rotation: best.rotation }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}
