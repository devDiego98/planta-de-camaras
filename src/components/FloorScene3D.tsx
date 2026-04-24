import { OrbitControls } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import type { ElementRef } from 'react'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { computePovPose, wallHeight } from '../camera3dMapping'
import type { CameraObject, FloorObject, LightObject } from '../types'
import { isCamera, isDoor, isGeneric, isLight, isPerson } from '../types'
import { PersonMannequin3D } from './PersonMannequin3D'

function PovRig({
  povCamera,
  roomWidth,
  roomHeight,
}: {
  povCamera: CameraObject
  roomWidth: number
  roomHeight: number
}) {
  const { camera } = useThree()
  const controlsRef = useRef<ElementRef<typeof OrbitControls>>(null)

  useLayoutEffect(() => {
    const apply = () => {
      if (!(camera instanceof THREE.PerspectiveCamera)) return
      const ctrl = controlsRef.current
      const { position: pos, target: tgt } = computePovPose(
        povCamera,
        roomWidth,
        roomHeight,
      )

      const maxY = Math.max(roomWidth, roomHeight, pos.y) * 2.8
      camera.fov = povCamera.fovDegrees
      camera.near = 0.2
      camera.far = Math.max(maxY, Math.hypot(roomWidth, roomHeight) * 8)
      camera.updateProjectionMatrix()

      camera.position.set(pos.x, pos.y, pos.z)
      camera.up.set(0, 1, 0)

      if (ctrl) {
        ctrl.target.set(tgt.x, tgt.y, tgt.z)
        ctrl.update()
      } else {
        camera.lookAt(tgt.x, tgt.y, tgt.z)
      }
    }

    apply()
    const id = requestAnimationFrame(apply)
    return () => cancelAnimationFrame(id)
  }, [camera, povCamera, roomHeight, roomWidth])

  const scale = Math.min(roomWidth, roomHeight)

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.06}
      minDistance={scale * 0.035}
      maxDistance={Math.max(roomWidth, roomHeight) * 3.5}
      minPolarAngle={0}
      maxPolarAngle={Math.PI - 0.02}
    />
  )
}

function RoomShell({
  roomWidth,
  roomHeight,
  wallH,
}: {
  roomWidth: number
  roomHeight: number
  wallH: number
}) {
  const wallT = Math.max(1.2, Math.min(roomWidth, roomHeight) * 0.014)
  const mat = (
    <meshStandardMaterial color="#cbd5e1" roughness={0.75} metalness={0.05} />
  )
  const trim = (
    <meshStandardMaterial color="#94a3b8" roughness={0.82} metalness={0.02} />
  )

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[roomWidth / 2, 0, roomHeight / 2]}
        receiveShadow
      >
        <planeGeometry args={[roomWidth, roomHeight]} />
        <meshStandardMaterial color="#e8edf4" roughness={0.88} metalness={0} />
      </mesh>

      <mesh position={[roomWidth / 2, wallH / 2, -wallT / 2]} castShadow receiveShadow>
        <boxGeometry args={[roomWidth + wallT * 2, wallH, wallT]} />
        {mat}
      </mesh>
      <mesh
        position={[roomWidth / 2, wallH / 2, roomHeight + wallT / 2]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[roomWidth + wallT * 2, wallH, wallT]} />
        {mat}
      </mesh>
      <mesh position={[-wallT / 2, wallH / 2, roomHeight / 2]} castShadow receiveShadow>
        <boxGeometry args={[wallT, wallH, roomHeight]} />
        {trim}
      </mesh>
      <mesh
        position={[roomWidth + wallT / 2, wallH / 2, roomHeight / 2]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[wallT, wallH, roomHeight]} />
        {trim}
      </mesh>
    </group>
  )
}

function planRotationToThreeY(rotationDeg: number): number {
  return (-rotationDeg * Math.PI) / 180
}

/** Unit vector along which light travels (ceiling fixture → floor), biased by plan aim (+X at 0°). */
function lightPropagationFromPlanRotation(rotationDeg: number): THREE.Vector3 {
  const ry = planRotationToThreeY(rotationDeg)
  const fx = Math.cos(ry)
  const fz = -Math.sin(ry)
  const horiz = 0.52
  return new THREE.Vector3(fx * horiz, -1, fz * horiz).normalize()
}

function averageLightPropagation(
  objects: FloorObject[],
  roomWidth: number,
  roomHeight: number,
): THREE.Vector3 {
  const lights = objects.filter((o) => o.type === 'light')
  const sum = new THREE.Vector3(0, 0, 0)
  for (const L of lights) {
    sum.add(lightPropagationFromPlanRotation(L.rotation))
  }
  if (sum.lengthSq() < 1e-10) {
    const wallH = wallHeight(roomWidth, roomHeight)
    const p = new THREE.Vector3(
      roomWidth * 0.55,
      wallH * 2.4,
      roomHeight * 0.45,
    )
    return p.clone().multiplyScalar(-1).normalize()
  }
  return sum.normalize()
}

const shadowMapSize = 2048

function shadowOrthoBounds(roomWidth: number, roomHeight: number) {
  const extent = Math.max(roomWidth, roomHeight) * 1.65
  const shadowFar = Math.max(roomWidth, roomHeight) * 6
  return { extent, shadowFar }
}

/** One directional per ceiling fixture: parallel rays along plan rotation, shadow falls “down-beam” from that source. */
function FixtureDirectionalShadow({
  fixtureX,
  fixtureY,
  fixtureZ,
  rotationDeg,
  intensity,
  roomWidth,
  roomHeight,
}: {
  fixtureX: number
  fixtureY: number
  fixtureZ: number
  rotationDeg: number
  intensity: number
  roomWidth: number
  roomHeight: number
}) {
  const lightRef = useRef<THREE.DirectionalLight>(null)
  const dist = Math.max(roomWidth, roomHeight) * 4.5

  const { position, targetPos } = useMemo(() => {
    const d = lightPropagationFromPlanRotation(rotationDeg)
    const fixture = new THREE.Vector3(fixtureX, fixtureY, fixtureZ)
    return {
      position: fixture.clone().addScaledVector(d, -dist),
      targetPos: fixture.clone().addScaledVector(d, Math.max(80, dist * 0.04)),
    }
  }, [fixtureX, fixtureY, fixtureZ, rotationDeg, dist])

  useLayoutEffect(() => {
    const L = lightRef.current
    if (!L) return
    L.target.position.copy(targetPos)
    L.target.updateMatrixWorld()
  }, [targetPos])

  const { extent, shadowFar } = shadowOrthoBounds(roomWidth, roomHeight)

  return (
    <directionalLight
      ref={lightRef}
      position={[position.x, position.y, position.z]}
      intensity={intensity}
      castShadow
      shadow-mapSize={[shadowMapSize, shadowMapSize]}
      shadow-camera-far={shadowFar}
      shadow-camera-left={-extent}
      shadow-camera-right={extent}
      shadow-camera-top={extent}
      shadow-camera-bottom={-extent}
    />
  )
}

/** Fallback when there are no plan lights: one key from averaged / default direction toward room center. */
function ShadowCastingKeyLight({
  roomWidth,
  roomHeight,
  objects,
  intensity,
}: {
  roomWidth: number
  roomHeight: number
  objects: FloorObject[]
  intensity: number
}) {
  const lightRef = useRef<THREE.DirectionalLight>(null)
  const target = useMemo(
    () => new THREE.Vector3(roomWidth / 2, 0, roomHeight / 2),
    [roomWidth, roomHeight],
  )

  const { position, dir } = useMemo(() => {
    const d = averageLightPropagation(objects, roomWidth, roomHeight)
    const dist = Math.max(roomWidth, roomHeight) * 4.5
    const pos = target.clone().sub(d.clone().multiplyScalar(dist))
    return { position: pos, dir: d }
  }, [objects, roomWidth, roomHeight, target])

  useLayoutEffect(() => {
    const L = lightRef.current
    if (!L) return
    L.target.position.copy(target)
    L.target.updateMatrixWorld()
  }, [target, dir, position])

  const { extent, shadowFar } = shadowOrthoBounds(roomWidth, roomHeight)

  return (
    <directionalLight
      ref={lightRef}
      position={[position.x, position.y, position.z]}
      intensity={intensity}
      castShadow
      shadow-mapSize={[shadowMapSize, shadowMapSize]}
      shadow-camera-far={shadowFar}
      shadow-camera-left={-extent}
      shadow-camera-right={extent}
      shadow-camera-top={extent}
      shadow-camera-bottom={-extent}
    />
  )
}

function PlanLightShadows({
  objects,
  roomWidth,
  roomHeight,
  wallH,
  intensity,
}: {
  objects: FloorObject[]
  roomWidth: number
  roomHeight: number
  wallH: number
  intensity: number
}) {
  const lights = objects.filter(isLight)
  const ceilingY = wallH * 0.94

  if (lights.length === 0) {
    return (
      <ShadowCastingKeyLight
        roomWidth={roomWidth}
        roomHeight={roomHeight}
        objects={objects}
        intensity={intensity}
      />
    )
  }

  const perLight = intensity / lights.length

  return (
    <>
      {lights.map((L: LightObject) => (
        <FixtureDirectionalShadow
          key={L.id}
          fixtureX={L.x}
          fixtureY={ceilingY}
          fixtureZ={L.y}
          rotationDeg={L.rotation}
          intensity={perLight}
          roomWidth={roomWidth}
          roomHeight={roomHeight}
        />
      ))}
    </>
  )
}

function Objects3D({
  objects,
  wallH,
  povCameraId,
  roomWidth,
  roomHeight,
}: {
  objects: FloorObject[]
  wallH: number
  povCameraId: string
  roomWidth: number
  roomHeight: number
}) {
  const yTall = wallH * 0.88
  const doorCenterY = yTall / 2
  const genericCenterY = (yTall * 0.92) / 2
  const base = Math.min(roomWidth, roomHeight)
  const personH = base * 0.092
  const camMountY = Math.max(10, base * 0.048)

  return (
    <group>
      {objects.map((o) => {
        if (isCamera(o)) {
          if (o.id === povCameraId) return null
          const ry = planRotationToThreeY(o.rotation)
          return (
            <group key={o.id} position={[o.x, camMountY, o.y]} rotation={[0, ry, 0]}>
              <mesh castShadow>
                <boxGeometry args={[18, 10, 14]} />
                <meshStandardMaterial color="#1f2937" roughness={0.65} />
              </mesh>
              <mesh position={[12, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
                <coneGeometry args={[7, 14, 8]} />
                <meshStandardMaterial color="#374151" roughness={0.55} />
              </mesh>
            </group>
          )
        }
        if (isLight(o)) {
          const ry = planRotationToThreeY(o.rotation)
          return (
            <group key={o.id} position={[o.x, wallH * 0.94, o.y]} rotation={[0, ry, 0]}>
              <mesh castShadow>
                <sphereGeometry args={[6, 12, 12]} />
                <meshStandardMaterial
                  color="#facc15"
                  emissive="#ca8a04"
                  emissiveIntensity={0.35}
                  roughness={0.4}
                />
              </mesh>
            </group>
          )
        }
        if (isPerson(o)) {
          const ry = planRotationToThreeY(o.rotation)
          return (
            <group key={o.id} position={[o.x, 0, o.y]} rotation={[0, ry, 0]}>
              <PersonMannequin3D height={personH} planRotationDeg={o.rotation} />
            </group>
          )
        }
        if (isDoor(o)) {
          const ry = planRotationToThreeY(o.rotation)
          return (
            <group key={o.id} position={[o.x, doorCenterY, o.y]} rotation={[0, ry, 0]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[36, yTall, 3]} />
                <meshStandardMaterial color="#64748b" roughness={0.78} />
              </mesh>
            </group>
          )
        }
        if (isGeneric(o)) {
          const ry = planRotationToThreeY(o.rotation)
          const gh = yTall * 0.92
          return (
            <group key={o.id} position={[o.x, genericCenterY, o.y]} rotation={[0, ry, 0]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[o.boxWidth, gh, o.boxHeight]} />
                <meshStandardMaterial
                  color="#94a3b8"
                  transparent
                  opacity={0.88}
                  roughness={0.72}
                />
              </mesh>
            </group>
          )
        }
        return null
      })}
    </group>
  )
}

interface FloorScene3DCanvasProps {
  roomWidth: number
  roomHeight: number
  objects: FloorObject[]
  povCamera: CameraObject
}

export function FloorScene3DCanvas({
  roomWidth,
  roomHeight,
  objects,
  povCamera,
}: FloorScene3DCanvasProps) {
  const wallH = wallHeight(roomWidth, roomHeight)
  const amb = 0.48
  const fill = 0.62

  return (
    <Canvas
      shadows
      gl={{ antialias: true, alpha: false }}
      style={{ width: '100%', height: '100%', display: 'block', background: '#0f172a' }}
      dpr={[1, 2]}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
      }}
    >
      <color attach="background" args={['#0f172a']} />
      <ambientLight intensity={amb} />
      <PlanLightShadows
        objects={objects}
        roomWidth={roomWidth}
        roomHeight={roomHeight}
        wallH={wallH}
        intensity={fill}
      />
      <directionalLight
        position={[-roomWidth * 0.35, wallH * 1.8, roomHeight * 1.1]}
        intensity={0.07}
        color="#e2e8f0"
      />
      <hemisphereLight args={['#f1f5f9', '#475569', 0.32]} />

      <RoomShell roomWidth={roomWidth} roomHeight={roomHeight} wallH={wallH} />
      <Objects3D
        objects={objects}
        wallH={wallH}
        povCameraId={povCamera.id}
        roomWidth={roomWidth}
        roomHeight={roomHeight}
      />

      <PovRig
        povCamera={povCamera}
        roomWidth={roomWidth}
        roomHeight={roomHeight}
      />
    </Canvas>
  )
}
