import type { FloorObject, Location } from './types'

const STORAGE_KEY = 'planta-de-camaras:v1'

export type PersistedFloorPlan = {
  version: 1
  locations: Location[]
  activeLocationId: string | null
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isFloorObject(v: unknown): v is FloorObject {
  if (!isRecord(v)) return false
  const t = v.type
  if (typeof v.id !== 'string' || typeof v.x !== 'number' || typeof v.y !== 'number') {
    return false
  }
  if (typeof v.rotation !== 'number') return false

  if (t === 'light') return true

  if (t === 'camera') {
    return (
      typeof v.label === 'string' &&
      typeof v.showLabelOnCanvas === 'boolean' &&
      typeof v.fovDegrees === 'number' &&
      typeof v.showFovCone === 'boolean' &&
      typeof v.valorPlano === 'string' &&
      typeof v.altura === 'string' &&
      typeof v.angulacion === 'string'
    )
  }

  if (t === 'person') {
    return typeof v.name === 'string' && typeof v.showNameOnCanvas === 'boolean'
  }

  if (t === 'door') {
    return typeof v.opensClockwise === 'boolean'
  }

  if (t === 'generic') {
    return (
      typeof v.name === 'string' &&
      typeof v.note === 'string' &&
      typeof v.boxWidth === 'number' &&
      typeof v.boxHeight === 'number' &&
      typeof v.showNameOnCanvas === 'boolean'
    )
  }

  return false
}

function isLocation(v: unknown): v is Location {
  if (!isRecord(v)) return false
  if (
    typeof v.id !== 'string' ||
    typeof v.name !== 'string' ||
    typeof v.width !== 'number' ||
    typeof v.height !== 'number' ||
    !Array.isArray(v.objects)
  ) {
    return false
  }
  return v.objects.every(isFloorObject)
}

function parsePersisted(raw: unknown): PersistedFloorPlan | null {
  if (!isRecord(raw)) return null
  if (raw.version !== 1) return null
  if (!Array.isArray(raw.locations) || raw.locations.length === 0) return null
  if (!raw.locations.every(isLocation)) return null
  const locations = raw.locations as Location[]
  const activeLocationId: string | null =
    typeof raw.activeLocationId === 'string' ? raw.activeLocationId : null
  return {
    version: 1,
    locations,
    activeLocationId,
  }
}

export function loadFloorPlanFromStorage(): PersistedFloorPlan | null {
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    if (!s) return null
    return parsePersisted(JSON.parse(s) as unknown)
  } catch {
    return null
  }
}

export function saveFloorPlanToStorage(payload: Omit<PersistedFloorPlan, 'version'>): boolean {
  try {
    const data: PersistedFloorPlan = { version: 1, ...payload }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}
