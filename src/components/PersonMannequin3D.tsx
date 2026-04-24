/**
 * Simple articulated mannequin (procedural); feet at local y = 0, +Y up.
 * `height` is total standing height in world units.
 */
export function PersonMannequin3D({ height: H }: { height: number }) {
  const skin = (
    <meshStandardMaterial color="#d8c8b6" roughness={0.5} metalness={0.02} />
  )
  const suit = (
    <meshStandardMaterial color="#5b6578" roughness={0.7} metalness={0.04} />
  )

  const headR = H * 0.11
  const shoulderY = H * 0.74
  const hipY = H * 0.42
  const kneeY = H * 0.22

  return (
    <group position={[0, -0.04 * H, 0]}>
      <mesh position={[0, H - headR * 0.85, 0]} castShadow>
        <sphereGeometry args={[headR, 18, 16]} />
        {skin}
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
