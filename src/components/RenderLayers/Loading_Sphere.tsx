import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const LoadingSphere: React.FC<{ radius?: number, isLoading: boolean }> = ({ radius = 2, isLoading }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.isLoading.value = isLoading;
    }
  }, [isLoading]);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = clock.getElapsedTime();
    }
  });

  const points = [];
  for (let i = 0; i <= 180; i++) {
    const phi = (i/180) * Math.PI;
    const x = radius * Math.sin(phi);
    const y = radius * Math.cos(phi);
    points.push(new THREE.Vector3(x,y,0));
  }

  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);

  return (
    <mesh ref={meshRef}>
    
        <bufferGeometry attach="geometry" {...lineGeometry} />
      
      <shaderMaterial
        ref={materialRef}
        transparent
        uniforms={{
          time: { value: 0 },
          color: {value: new THREE.Color(0x00ff00)},
        }}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float time;
          uniform bool isLoading;
          varying vec2 vUv;
          
          void main() {
            if (!isLoading) {
              discard;
            }
            
            float t = mod(time, 4.0) / 2.0;
            float alpha = smoothstep(t - 0.2, t, vUv.y) - smoothstep(t, t + 0.2, vUv.y);
            if (t > 1.0) {
              alpha = 1.0 - alpha;
            }
            
            gl_FragColor = vec4(0.0, 1.0, 0.5, alpha * 0.5);
          }
        `}
      />
    </mesh>
  )
};

export default LoadingSphere;