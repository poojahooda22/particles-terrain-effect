import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useControls } from 'leva'

// Procedural terrain height generation (creating a rolling hilly landscape)
function generateHeight(x: number, z: number) {
  let y = Math.sin(x * 0.15) * 2.0 + Math.cos(z * 0.15) * 2.0;
  y += Math.sin(x * 0.5 + z * 0.4) * 0.5;
  return y;
}

const GRID_SIZE = 128
const GRID_SPACING = 0.5
const COUNT = GRID_SIZE * GRID_SIZE

export default function TerrainParticles() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const { camera } = useThree()
  
  // UI Controls for tuning the look and interaction
  const controls = useControls('Terrain', {
    rippleSize: { value: 6.0, min: 1.0, max: 20.0 },
    rippleSpeed: { value: 5.0, min: 0.1, max: 15.0 },
    rippleHeight: { value: 2.0, min: 0.0, max: 10.0 },
    particleSize: { value: 0.08, min: 0.01, max: 0.5 },
  })

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const mousePos = useRef(new THREE.Vector3(9999, 9999, 9999))
  
  // Create base positions for the grid
  const basePositions = useMemo(() => {
    const pos = []
    const offset = (GRID_SIZE * GRID_SPACING) / 2
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const x = i * GRID_SPACING - offset
        const z = j * GRID_SPACING - offset
        pos.push({ x, z, y: generateHeight(x, z) })
      }
    }
    return pos
  }, [])

  useFrame((state) => {
    const { clock, pointer } = state
    const time = clock.elapsedTime
    
    // Cast a ray from the camera to the Z=0 plane to find the mouse intersection
    const vec = new THREE.Vector3(pointer.x, pointer.y, 0.5)
    vec.unproject(camera)
    const dir = vec.sub(camera.position).normalize()
    
    // We want the intersection on a rough horizontal plane near Y=0
    // Since the terrain is hilly, we'll approximate the intersection at Y=0
    if (dir.y !== 0) {
      const distance = -camera.position.y / dir.y
      if (distance > 0) {
        const pos = camera.position.clone().add(dir.multiplyScalar(distance))
        mousePos.current.lerp(pos, 0.15)
      }
    } else {
      mousePos.current.set(9999, 9999, 9999)
    }

    if (!meshRef.current) return

    for (let i = 0; i < COUNT; i++) {
      const base = basePositions[i]
      let currentY = base.y
      
      // Calculate distance to mouse for the ripple effect
      const dx = base.x - mousePos.current.x
      const dz = base.z - mousePos.current.z
      const distToMouse = Math.sqrt(dx * dx + dz * dz)
      
      // Add propagating wave ripple based on distance and time
      if (distToMouse < controls.rippleSize) {
        const ripplePhase = distToMouse * 2.0 - time * controls.rippleSpeed
        // Damping the ripple outwards
        const damping = 1.0 - (distToMouse / controls.rippleSize)
        currentY += Math.sin(ripplePhase) * controls.rippleHeight * damping
      }
      
      dummy.position.set(base.x, currentY, base.z)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <boxGeometry args={[controls.particleSize, controls.particleSize, controls.particleSize]} />
      <meshBasicMaterial color="#ffffff" />
    </instancedMesh>
  )
}
