import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { Suspense } from 'react';
import { motion } from 'motion/react';

interface Game3DSceneProps {
  children?: React.ReactNode;
  cameraPosition?: [number, number, number];
  enableControls?: boolean;
  className?: string;
}

export function Game3DScene({ 
  children, 
  cameraPosition = [0, 0, 5],
  enableControls = true,
  className = ''
}: Game3DSceneProps) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        shadows
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={cameraPosition} fov={75} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
          <pointLight position={[-10, -10, -5]} intensity={0.5} />
          
          {enableControls && <OrbitControls enablePan={false} enableZoom={false} />}
          
          <Environment preset="sunset" />
          
          {children}
        </Suspense>
      </Canvas>
    </div>
  );
}

// 3D 球体组件（用于乒乓球等游戏）
export function Ball3D({ position, color = '#ffffff' }: { position: [number, number, number]; color?: string }) {
  return (
    <mesh position={position} castShadow>
      <sphereGeometry args={[0.1, 32, 32]} />
      <meshStandardMaterial color={color} metalness={0.3} roughness={0.2} />
    </mesh>
  );
}

// 3D 板子组件（用于球拍等）
export function Paddle3D({ 
  position, 
  rotation = [0, 0, 0],
  color = '#ff0000'
}: { 
  position: [number, number, number]; 
  rotation?: [number, number, number];
  color?: string;
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <boxGeometry args={[0.05, 0.3, 0.01]} />
      <meshStandardMaterial color={color} metalness={0.5} roughness={0.3} />
    </mesh>
  );
}

// 3D 地面组件
export function Ground3D({ size = 10 }: { size?: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial color="#4ade80" />
    </mesh>
  );
}

