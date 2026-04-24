/**
 * Simple articulated mannequin (procedural); feet at local y = 0, +Y up.
 * 2D icon: head toward local (0,-1) under `rotate(θ)` (same transform as FloorCanvas).
 * `localPointToWorld` maps that to plan (sin θ, -cos θ); 3D uses plan x→X, plan y→Z.
 * Parent applies R_y(-θ); face offsets are derived so features face that plan direction.
 */
export function PersonMannequin3D({
  height: H,
  planRotationDeg,
}: {
  height: number
  planRotationDeg: number
}) {
  const skin = (
    <meshStandardMaterial color="#d8c8b6" roughness={0.5} metalness={0.02} />
  )
  const suit = (
    <meshStandardMaterial color="#5b6578" roughness={0.7} metalness={0.04} />
  )
  const eyeMat = (
    <meshStandardMaterial
      color="#0b1220"
      roughness={0.35}
      metalness={0.05}
      emissive="#1e293b"
      emissiveIntensity={0.45}
    />
  )
  const mouthMat = (
    <meshStandardMaterial
      color="#0b1220"
      roughness={0.6}
      emissive="#334155"
      emissiveIntensity={0.25}
    />
  )
  const noseMat = (
    <meshStandardMaterial
      color="#b8a090"
      roughness={0.45}
      metalness={0.02}
      emissive="#8a7b6c"
      emissiveIntensity={0.08}
    />
  )

  const headR = H * 0.11
  const shoulderY = H * 0.74
  const hipY = H * 0.42
  const kneeY = H * 0.22
  const headCy = H - headR * 0.85
  const eyeR = headR * 0.17

  const t = (planRotationDeg * Math.PI) / 180
  /** Plan forward in XZ (matches `localPointToWorld(0,-1,0,0,θ)` in fov.ts / FloorCanvas). */
  const fxw = Math.sin(t)
  const fzw = -Math.cos(t)
  const ry = -t
  const c = Math.cos(ry)
  const s = Math.sin(ry)
  /** Local offset: world = R_y(ry) * local → local = R_y(-ry) * world = R_y(t) * world. */
  const lx = c * fxw - s * fzw
  const lz = s * fxw + c * fzw
  /** Outward normal for facial features = plan forward in local XZ (same as 2D icon “nose” side, local (0,-1)). */
  const ox = lx
  const oz = lz
  /** Horizontal “right” on the face, in local XZ (perpendicular to outward). */
  const ux = -oz
  const uz = ox

  const ax = ox * headR * 1.02
  const az = oz * headR * 1.02
  const es = headR * 0.34
  const noseF = headR * 0.3
  const mouthF = headR * 0.1

  return (
    <group position={[0, -0.04 * H, 0]}>
      <mesh position={[0, headCy, 0]} castShadow>
        <sphereGeometry args={[headR, 18, 16]} />
        {skin}
      </mesh>

      <mesh
        position={[ax + ux * es, headCy + headR * 0.1, az + uz * es]}
        castShadow={false}
      >
        <sphereGeometry args={[eyeR, 10, 10]} />
        {eyeMat}
      </mesh>
      <mesh
        position={[ax - ux * es, headCy + headR * 0.1, az - uz * es]}
        castShadow={false}
      >
        <sphereGeometry args={[eyeR, 10, 10]} />
        {eyeMat}
      </mesh>
      <mesh
        position={[ax + ox * noseF, headCy - headR * 0.02, az + oz * noseF]}
        castShadow={false}
      >
        <sphereGeometry args={[headR * 0.12, 8, 8]} />
        {noseMat}
      </mesh>
      <mesh
        position={[ax + ox * mouthF, headCy - headR * 0.26, az + oz * mouthF]}
        castShadow={false}
      >
        <boxGeometry args={[headR * 0.52, headR * 0.11, headR * 0.1]} />
        {mouthMat}
      </mesh>

      <mesh position={[0, shoulderY - H * 0.09, 0]} castShadow>
        <boxGeometry args={[H * 0.4, H * 0.22, H * 0.22]} />
        {suit}
      </mesh>

      <mesh position={[0, hipY, 0]} castShadow>
        <boxGeometry args={[H * 0.34, H * 0.36, H * 0.2]} />
        {suit}
      </mesh>

      <mesh position={[-H * 0.12, kneeY, 0]} castShadow>
        <boxGeometry args={[H * 0.16, H * 0.36, H * 0.16]} />
        {suit}
      </mesh>
      <mesh position={[H * 0.12, kneeY, 0]} castShadow>
        <boxGeometry args={[H * 0.16, H * 0.36, H * 0.16]} />
        {suit}
      </mesh>

      <mesh
        position={[-H * 0.26, shoulderY - H * 0.02, 0]}
        rotation={[0, 0, 0.12]}
        castShadow
      >
        <boxGeometry args={[H * 0.12, H * 0.34, H * 0.12]} />
        {suit}
      </mesh>
      <mesh
        position={[H * 0.26, shoulderY - H * 0.02, 0]}
        rotation={[0, 0, -0.12]}
        castShadow
      >
        <boxGeometry args={[H * 0.12, H * 0.34, H * 0.12]} />
        {suit}
      </mesh>
    </group>
  )
}
