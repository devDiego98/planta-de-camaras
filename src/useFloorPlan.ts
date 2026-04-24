import { useCallback, useMemo, useRef, useState } from 'react'
import { snapDoorToNearestWall } from './doorSnap'
import { loadFloorPlanFromStorage, saveFloorPlanToStorage } from './floorPlanStorage'
import type {
  CameraObject,
  DoorObject,
  FloorObject,
  GenericObject,
  Location,
  PersonObject,
} from './types'

function uid(): string {
  return crypto.randomUUID()
}

function nextCameraLabel(existing: FloorObject[]): string {
  const n = existing.filter((o) => o.type === 'camera').length
  const letter = String.fromCharCode(65 + (n % 26))
  return `Cámara ${letter}`
}

function defaultCamera(x: number, y: number, label: string): CameraObject {
  return {
    id: uid(),
    type: 'camera',
    x,
    y,
    rotation: 0,
    label,
    showLabelOnCanvas: true,
    fovDegrees: 55,
    showFovCone: false,
    valorPlano: 'plano_medio',
    altura: 'normal',
    angulacion: 'normal',
  }
}

function defaultLight(x: number, y: number): FloorObject {
  return { id: uid(), type: 'light', x, y, rotation: 0 }
}

function defaultPerson(x: number, y: number): PersonObject {
  return {
    id: uid(),
    type: 'person',
    x,
    y,
    rotation: 0,
    name: '',
    showNameOnCanvas: false,
  }
}

function defaultDoor(roomW: number, roomH: number): DoorObject {
  const s = snapDoorToNearestWall(roomW / 2, roomH - 48, roomW, roomH)
  return {
    id: uid(),
    type: 'door',
    x: s.x,
    y: s.y,
    rotation: s.rotation,
    opensClockwise: true,
  }
}

function defaultGeneric(x: number, y: number): GenericObject {
  return {
    id: uid(),
    type: 'generic',
    x,
    y,
    rotation: 0,
    name: 'Objeto',
    note: '',
    boxWidth: 120,
    boxHeight: 72,
    showNameOnCanvas: true,
  }
}

function defaultFirstLocation(): Location {
  const id = uid()
  return {
    id,
    name: 'Locación 1',
    width: 920,
    height: 560,
    objects: [],
  }
}

function loadInitialFloorPlan(): {
  locations: Location[]
  activeLocationId: string | null
} {
  const loaded = loadFloorPlanFromStorage()
  if (loaded && loaded.locations.length > 0) {
    const locs = loaded.locations
    const aid =
      loaded.activeLocationId && locs.some((l) => l.id === loaded.activeLocationId)
        ? loaded.activeLocationId
        : locs[0]!.id
    return { locations: locs, activeLocationId: aid }
  }
  const loc = defaultFirstLocation()
  return { locations: [loc], activeLocationId: loc.id }
}

export function useFloorPlan() {
  const initRef = useRef<{ locations: Location[]; activeLocationId: string | null } | null>(null)
  const [locations, setLocations] = useState<Location[]>(() => {
    if (!initRef.current) initRef.current = loadInitialFloorPlan()
    return initRef.current.locations
  })
  const [activeLocationId, setActiveLocationId] = useState<string | null>(() => {
    if (!initRef.current) initRef.current = loadInitialFloorPlan()
    return initRef.current.activeLocationId
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const activeLocation = useMemo(
    () => locations.find((l) => l.id === activeLocationId) ?? null,
    [locations, activeLocationId],
  )

  const updateActiveObjects = useCallback(
    (fn: (objects: FloorObject[]) => FloorObject[]) => {
      if (!activeLocationId) return
      setLocations((prev) =>
        prev.map((l) =>
          l.id === activeLocationId ? { ...l, objects: fn(l.objects) } : l,
        ),
      )
    },
    [activeLocationId],
  )

  const addLocation = useCallback(() => {
    const loc: Location = {
      id: uid(),
      name: `Locación ${locations.length + 1}`,
      width: 920,
      height: 560,
      objects: [],
    }
    setLocations((p) => [...p, loc])
    setActiveLocationId(loc.id)
    setSelectedId(null)
  }, [locations.length])

  const renameLocation = useCallback((id: string, name: string) => {
    setLocations((p) => p.map((l) => (l.id === id ? { ...l, name } : l)))
  }, [])

  const addObject = useCallback(
    (kind: FloorObject['type']) => {
      if (!activeLocation) return
      const cx = activeLocation.width / 2
      const cy = activeLocation.height / 2
      const label = nextCameraLabel(activeLocation.objects)
      let obj: FloorObject
      if (kind === 'camera') obj = defaultCamera(cx, cy, label)
      else if (kind === 'light') obj = defaultLight(cx - 80, cy)
      else if (kind === 'person') obj = defaultPerson(cx + 80, cy)
      else if (kind === 'door') obj = defaultDoor(activeLocation.width, activeLocation.height)
      else obj = defaultGeneric(cx, cy - 40)

      updateActiveObjects((objs) => [...objs, obj])
      setSelectedId(obj.id)
    },
    [activeLocation, updateActiveObjects],
  )

  const patchObject = useCallback(
    (id: string, patch: Partial<FloorObject>) => {
      updateActiveObjects((objs) =>
        objs.map((o) => (o.id === id ? ({ ...o, ...patch } as FloorObject) : o)),
      )
    },
    [updateActiveObjects],
  )

  const patchCamera = useCallback(
    (
      id: string,
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
          | 'rotation'
          | 'x'
          | 'y'
        >
      >,
    ) => {
      updateActiveObjects((objs) =>
        objs.map((o) =>
          o.id === id && o.type === 'camera'
            ? ({ ...o, ...patch } as CameraObject)
            : o,
        ),
      )
    },
    [updateActiveObjects],
  )

  const removeSelected = useCallback(() => {
    if (!selectedId) return
    updateActiveObjects((objs) => objs.filter((o) => o.id !== selectedId))
    setSelectedId(null)
  }, [selectedId, updateActiveObjects])

  const selectedObject = useMemo(() => {
    if (!activeLocation || !selectedId) return null
    return activeLocation.objects.find((o) => o.id === selectedId) ?? null
  }, [activeLocation, selectedId])

  const saveToLocalStorage = useCallback(() => {
    return saveFloorPlanToStorage({ locations, activeLocationId })
  }, [locations, activeLocationId])

  return {
    locations,
    activeLocationId,
    setActiveLocationId,
    activeLocation,
    selectedId,
    setSelectedId,
    selectedObject,
    addLocation,
    renameLocation,
    addObject,
    patchObject,
    patchCamera,
    removeSelected,
    saveToLocalStorage,
  }
}

export type FloorPlanApi = ReturnType<typeof useFloorPlan>
