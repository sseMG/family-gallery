import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'

function PhotoFrame({ position, rotationSpeed, scale = 1 }) {
  const groupRef = useRef()

  useFrame((_, delta) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y += delta * rotationSpeed
    groupRef.current.rotation.x += delta * rotationSpeed * 0.35
  })

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.4, 1.75, 0.1]} />
        <meshStandardMaterial
          color="#c9a96e"
          metalness={0.55}
          roughness={0.35}
        />
      </mesh>
      <mesh position={[0, 0, 0.06]}>
        <planeGeometry args={[1.15, 1.45]} />
        <meshStandardMaterial color="#1a1612" roughness={0.9} />
      </mesh>
    </group>
  )
}

function FloatingFrames() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[4, 4, 4]} intensity={1.2} color="#c9a96e" />
      <pointLight position={[-4, -2, 2]} intensity={0.5} color="#f5f0e8" />
      <PhotoFrame position={[-2.4, 0.6, 0]} rotationSpeed={0.18} scale={0.9} />
      <PhotoFrame position={[0, -0.4, -0.8]} rotationSpeed={0.12} scale={1.05} />
      <PhotoFrame position={[2.5, 0.9, 0.3]} rotationSpeed={0.22} scale={0.85} />
      <PhotoFrame position={[0.8, 1.8, -1.2]} rotationSpeed={0.15} scale={0.75} />
    </>
  )
}

export default function Scene() {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
      <Canvas
        style={{ background: 'transparent', width: '100%', height: '100%' }}
        camera={{ position: [0, 0, 7], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <FloatingFrames />
      </Canvas>
    </div>
  )
}