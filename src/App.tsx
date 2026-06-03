import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Suspense } from 'react'
import TerrainParticles from './components/TerrainParticles'

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#050505', overflow: 'hidden' }}>
      <Canvas camera={{ position: [0, 20, 30], fov: 45 }}>
        <color attach="background" args={['#050505']} />
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2 - 0.1} // Prevent going below ground
        />
        <Suspense fallback={null}>
          <TerrainParticles />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default App
