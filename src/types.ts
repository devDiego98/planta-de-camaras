export type ValorPlano =
  | 'primerisimo_primer_plano'
  | 'plano_medio'
  | 'plano_americano'
  | 'plano_entero'
  | 'plano_conjunto'
  | 'plano_general'
  | 'gran_plano_general'

export type AlturaCamara = 'alta' | 'normal' | 'baja'

export type Angulacion =
  | 'cenital'
  | 'picado'
  | 'normal'
  | 'contra_picado'
  | 'nadir'

export type FloorObjectKind =
  | 'camera'
  | 'light'
  | 'person'
  | 'door'
  | 'generic'

export interface FloorObjectBase {
  id: string
  type: FloorObjectKind
  x: number
  y: number
  /** Grados; 0 = hacia la derecha (+X), positivo = horario (convención SVG). */
  rotation: number
}

export interface CameraObject extends FloorObjectBase {
  type: 'camera'
  label: string
  /** Si es true, se dibuja `label` bajo el icono en el canvas. */
  showLabelOnCanvas: boolean
  fovDegrees: number
  showFovCone: boolean
  valorPlano: ValorPlano
  altura: AlturaCamara
  angulacion: Angulacion
}

export interface LightObject extends FloorObjectBase {
  type: 'light'
}

export interface PersonObject extends FloorObjectBase {
  type: 'person'
  name: string
  showNameOnCanvas: boolean
}

export interface DoorObject extends FloorObjectBase {
  type: 'door'
  /** Vista en planta: abertura en sentido horario o antihorario alrededor del gozne. */
  opensClockwise: boolean
}

/** Rectángulo genérico (mesa, muro, zona, etc.); posición = centro. */
export interface GenericObject extends FloorObjectBase {
  type: 'generic'
  name: string
  note: string
  boxWidth: number
  boxHeight: number
  showNameOnCanvas: boolean
}

export type FloorObject =
  | CameraObject
  | LightObject
  | PersonObject
  | DoorObject
  | GenericObject

export interface Location {
  id: string
  name: string
  width: number
  height: number
  objects: FloorObject[]
}

export const VALOR_PLANO_LABELS: Record<ValorPlano, string> = {
  primerisimo_primer_plano: 'Primerísimo primer plano',
  plano_medio: 'Plano medio',
  plano_americano: 'Plano americano',
  plano_entero: 'Plano entero',
  plano_conjunto: 'Plano conjunto',
  plano_general: 'Plano general',
  gran_plano_general: 'Gran plano general',
}

export const ALTURA_LABELS: Record<AlturaCamara, string> = {
  alta: 'Alta',
  normal: 'Normal',
  baja: 'Baja',
}

export const ANGULACION_LABELS: Record<Angulacion, string> = {
  cenital: 'Cenital',
  picado: 'Picado',
  normal: 'Normal',
  contra_picado: 'Contra picado',
  nadir: 'Nadir',
}

export function isCamera(o: FloorObject): o is CameraObject {
  return o.type === 'camera'
}

export function isLight(o: FloorObject): o is LightObject {
  return o.type === 'light'
}

export function isGeneric(o: FloorObject): o is GenericObject {
  return o.type === 'generic'
}

export function isDoor(o: FloorObject): o is DoorObject {
  return o.type === 'door'
}

export function isPerson(o: FloorObject): o is PersonObject {
  return o.type === 'person'
}
