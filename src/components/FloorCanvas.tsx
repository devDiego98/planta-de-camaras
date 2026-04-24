import { useCallback, useId, useRef, useState } from 'react'
import { DOOR_HALF_LENGTH, snapDoorToNearestWall } from '../doorSnap'
import { fovSectorPath } from '../fov'
import { clientToSvg } from '../svgCoords'
import type { FloorObject, GenericObject } from '../types'
import { isCamera, isDoor, isGeneric, isPerson } from '../types'

const FOV_DRAW_RADIUS = 420
const WALL_STROKE = 3

type DragMode = 'move' | 'rotate' | null

interface FloorCanvasProps {
  width: number
  height: number
  objects: FloorObject[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onPatchObject: (id: string, patch: Partial<FloorObject>) => void
}

/** Offset from object origin to canvas label anchor (local +Y = under the icon). */
const CANVAS_LABEL_DY = 28

function CameraShape({ selected }: { selected: boolean }) {
  const stroke = selected ? '#2563eb' : '#111827'
  /** Cuerpo: x∈[-22,14], y∈[-14,8] → borde derecho x=14, centro vertical y=-3. Contorno FOV: `CAMERA_FOOTPRINT_LOCAL` en fov.ts. */
  const edgeX = 14
  const midY = -3
  const halfBase = 9
  return (
    <g aria-hidden>
      <rect x={-22} y={-14} width={36} height={22} rx={3} fill="#1f2937" stroke={stroke} strokeWidth={selected ? 2 : 1} />
      <polygon
        points={`${edgeX},${midY - halfBase} ${edgeX + 14},${midY} ${edgeX},${midY + halfBase}`}
        fill="#374151"
        stroke={stroke}
        strokeWidth={selected ? 2 : 1}
      />
      <circle cx={-6} cy={-3} r={6} fill="#0ea5e9" opacity={0.35} />
    </g>
  )
}

function LightShape({ selected }: { selected: boolean }) {
  const s = selected ? '#ca8a04' : '#a16207'
  return (
    <g aria-hidden>
      <rect x={-14} y={-14} width={28} height={28} rx={2} fill="#facc15" stroke={s} strokeWidth={selected ? 2 : 1} />
      <line x1={0} y1={14} x2={0} y2={22} stroke={s} strokeWidth={2} />
      <line x1={-10} y1={22} x2={10} y2={22} stroke={s} strokeWidth={2} />
    </g>
  )
}

function PersonShape({ selected }: { selected: boolean }) {
  const s = selected ? '#2563eb' : '#6b7280'
  return (
    <g aria-hidden>
      <ellipse cx={0} cy={4} rx={14} ry={10} fill="#e5e7eb" stroke={s} strokeWidth={selected ? 2 : 1} />
      <circle cx={0} cy={-10} r={7} fill="#d1d5db" stroke={s} strokeWidth={selected ? 2 : 1} />
    </g>
  )
}

function DoorShape({
  selected,
  opensClockwise,
}: {
  selected: boolean
  opensClockwise: boolean
}) {
  const hl = DOOR_HALF_LENGTH
  const stroke = selected ? '#2563eb' : 'var(--room-wall)'
  const sw = selected ? 2 : WALL_STROKE
  /** Local +Y points toward the wall / exterior; room interior is −Y. */
  const jamb = 5
  const tick = 6
  const panelLen = hl * 2 * 0.92
  const invSqrt2 = 0.7071067811865476
  const hingeX = opensClockwise ? -hl : hl
  const hingeY = 0
  const panelDx = (opensClockwise ? 1 : -1) * panelLen * invSqrt2
  const panelDy = -panelLen * invSqrt2
  const tickDx = opensClockwise ? -tick : tick
  return (
    <g aria-hidden stroke={stroke} strokeWidth={sw} strokeLinecap="square" fill="none">
      <line x1={-hl} y1={0} x2={-hl} y2={jamb} />
      <line x1={hl} y1={0} x2={hl} y2={jamb} />
      <line x1={hingeX} y1={hingeY} x2={hingeX + tickDx} y2={hingeY} />
      <line x1={hingeX} y1={hingeY} x2={hingeX + panelDx} y2={hingeY + panelDy} />
    </g>
  )
}

function GenericShape({ o, selected }: { o: GenericObject; selected: boolean }) {
  const w = o.boxWidth
  const h = o.boxHeight
  const stroke = selected ? '#2563eb' : '#64748b'
  const fs = Math.max(9, Math.min(15, Math.min(w, h) * 0.14))
  return (
    <g aria-hidden>
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        rx={3}
        fill="rgba(148, 163, 184, 0.22)"
        stroke={stroke}
        strokeWidth={selected ? 2.5 : 1.5}
      />
      {o.showNameOnCanvas && o.name.trim() ? (
        <text
          x={0}
          y={0}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--text-h, #0f172a)"
          fontSize={fs}
          fontWeight={500}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {o.name}
        </text>
      ) : null}
    </g>
  )
}

function rotateHandleDistance(o: FloorObject): number {
  if (isGeneric(o)) {
    return Math.hypot(o.boxWidth, o.boxHeight) / 2 + 28
  }
  return 46
}

function UprightCanvasLabel({ rotationDeg, children }: { rotationDeg: number; children: string }) {
  if (!children.trim()) return null
  return (
    <g transform={`translate(0, ${CANVAS_LABEL_DY}) rotate(${-rotationDeg})`}>
      <text
        x={0}
        y={0}
        textAnchor="middle"
        dominantBaseline="hanging"
        fill="var(--text-h, #0f172a)"
        stroke="var(--canvas-label-stroke)"
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
        paintOrder="stroke fill"
        fontSize={12}
        fontWeight={500}
        style={{ pointerEvents: 'none', userSelect: 'none', paintOrder: 'stroke fill' }}
      >
        {children}
      </text>
    </g>
  )
}

function dragMargin(o: FloorObject | undefined): number {
  if (!o) return 16
  if (isGeneric(o)) {
    return Math.max(16, Math.hypot(o.boxWidth, o.boxHeight) / 2 + 2)
  }
  return 16
}

export function FloorCanvas({
  width,
  height,
  objects,
  selectedId,
  onSelect,
  onPatchObject,
}: FloorCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const gridPatternId = `grid-${useId().replace(/:/g, '')}`
  const [drag, setDrag] = useState<{
    mode: DragMode
    id: string
    startX: number
    startY: number
    origX: number
    origY: number
    origRot: number
    pivotX: number
    pivotY: number
    startAngle: number
  } | null>(null)

  const onBgPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.target !== e.currentTarget) return
      onSelect(null)
    },
    [onSelect],
  )

  const beginMove = useCallback(
    (e: React.PointerEvent, o: FloorObject) => {
      e.stopPropagation()
      e.preventDefault()
      const svg = svgRef.current
      if (!svg) return
      const { x, y } = clientToSvg(svg, e.clientX, e.clientY)
      onSelect(o.id)
      setDrag({
        mode: 'move',
        id: o.id,
        startX: x,
        startY: y,
        origX: o.x,
        origY: o.y,
        origRot: o.rotation,
        pivotX: o.x,
        pivotY: o.y,
        startAngle: 0,
      })
      svg.setPointerCapture(e.pointerId)
    },
    [onSelect],
  )

  const beginRotate = useCallback(
    (e: React.PointerEvent, o: FloorObject) => {
      if (isDoor(o)) return
      e.stopPropagation()
      e.preventDefault()
      const svg = svgRef.current
      if (!svg) return
      const { x, y } = clientToSvg(svg, e.clientX, e.clientY)
      onSelect(o.id)
      const startAngle =
        (Math.atan2(y - o.y, x - o.x) * 180) / Math.PI
      setDrag({
        mode: 'rotate',
        id: o.id,
        startX: x,
        startY: y,
        origX: o.x,
        origY: o.y,
        origRot: o.rotation,
        pivotX: o.x,
        pivotY: o.y,
        startAngle,
      })
      svg.setPointerCapture(e.pointerId)
    },
    [onSelect],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!drag || drag.mode === null) return
      e.preventDefault()
      const svg = svgRef.current
      if (!svg) return
      const { x, y } = clientToSvg(svg, e.clientX, e.clientY)
      if (drag.mode === 'move') {
        const dx = x - drag.startX
        const dy = y - drag.startY
        let nx = drag.origX + dx
        let ny = drag.origY + dy
        const o = objects.find((ob) => ob.id === drag.id)
        if (o && isDoor(o)) {
          const snapped = snapDoorToNearestWall(nx, ny, width, height)
          onPatchObject(drag.id, {
            x: snapped.x,
            y: snapped.y,
            rotation: snapped.rotation,
          })
        } else {
          const m = dragMargin(o)
          nx = Math.max(m, Math.min(width - m, nx))
          ny = Math.max(m, Math.min(height - m, ny))
          onPatchObject(drag.id, { x: nx, y: ny })
        }
      } else if (drag.mode === 'rotate') {
        const ang = (Math.atan2(y - drag.pivotY, x - drag.pivotX) * 180) / Math.PI
        let delta = ang - drag.startAngle
        while (delta > 180) delta -= 360
        while (delta < -180) delta += 360
        onPatchObject(drag.id, { rotation: drag.origRot + delta })
      }
    },
    [drag, height, objects, onPatchObject, width],
  )

  const endDrag = useCallback((e: React.PointerEvent) => {
    const svg = svgRef.current
    if (svg?.hasPointerCapture?.(e.pointerId)) {
      svg.releasePointerCapture(e.pointerId)
    }
    setDrag(null)
  }, [])

  const onLostPointerCapture = useCallback(() => {
    setDrag(null)
  }, [])

  const handlePos = (o: FloorObject) => {
    const r = (o.rotation * Math.PI) / 180
    const d = rotateHandleDistance(o)
    return {
      hx: o.x + Math.cos(r) * d,
      hy: o.y + Math.sin(r) * d,
    }
  }

  return (
    <svg
      ref={svgRef}
      className="floor-canvas"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={onLostPointerCapture}
      onPointerDown={onBgPointerDown}
      role="img"
      aria-label="Planta de la locación"
    >
      <defs>
        <pattern
          id={gridPatternId}
          width={24}
          height={24}
          patternUnits="userSpaceOnUse"
        >
          <path d="M 24 0 L 0 0 0 24" fill="none" stroke="var(--grid-line)" strokeWidth={0.5} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="var(--canvas-bg)" />
      <rect width="100%" height="100%" fill={`url(#${gridPatternId})`} opacity={0.45} />
      <rect
        x={WALL_STROKE / 2}
        y={WALL_STROKE / 2}
        width={width - WALL_STROKE}
        height={height - WALL_STROKE}
        fill="none"
        stroke="var(--room-wall)"
        strokeWidth={WALL_STROKE}
      />

      {objects.map((o) => {
        if (!isCamera(o) || !o.showFovCone) return null
        return (
          <path
            key={`fov-${o.id}`}
            d={fovSectorPath(o.x, o.y, o.rotation, o.fovDegrees, FOV_DRAW_RADIUS)}
            fill="rgba(37, 99, 235, 0.14)"
            stroke="rgba(37, 99, 235, 0.55)"
            strokeWidth={1.5}
            pointerEvents="none"
          />
        )
      })}

      {objects.map((o) => {
        const sel = o.id === selectedId
        const { hx, hy } = handlePos(o)
        return (
          <g key={o.id}>
            <g
              transform={`translate(${o.x},${o.y}) rotate(${o.rotation})`}
              style={{
                cursor: drag?.mode === 'move' && drag.id === o.id ? 'grabbing' : 'grab',
                touchAction: 'none',
              }}
              onPointerDown={(e) => beginMove(e, o)}
            >
              {isCamera(o) && <CameraShape selected={sel} />}
              {o.type === 'light' && <LightShape selected={sel} />}
              {isPerson(o) && <PersonShape selected={sel} />}
              {isCamera(o) && o.showLabelOnCanvas ? (
                <UprightCanvasLabel rotationDeg={o.rotation}>{o.label}</UprightCanvasLabel>
              ) : null}
              {isPerson(o) && o.showNameOnCanvas ? (
                <UprightCanvasLabel rotationDeg={o.rotation}>{o.name}</UprightCanvasLabel>
              ) : null}
              {isDoor(o) && (
                <DoorShape
                  selected={sel}
                  opensClockwise={o.opensClockwise}
                />
              )}
              {o.type === 'generic' && <GenericShape o={o} selected={sel} />}
            </g>
            {sel && !isDoor(o) ? (
              <g>
                <line
                  x1={o.x}
                  y1={o.y}
                  x2={hx}
                  y2={hy}
                  stroke="var(--accent)"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  pointerEvents="none"
                />
                <circle
                  cx={hx}
                  cy={hy}
                  r={8}
                  fill="var(--panel-bg)"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  style={{ cursor: 'alias', touchAction: 'none' }}
                  onPointerDown={(e) => beginRotate(e, o)}
                />
              </g>
            ) : null}
          </g>
        )
      })}
    </svg>
  )
}
