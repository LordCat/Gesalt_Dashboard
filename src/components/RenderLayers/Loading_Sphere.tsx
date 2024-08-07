import React, { useRef} from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const LoadingSphere: React.FC<{ radius?: number, isLoading: boolean }> = ({ radius = 2, isLoading }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = clock.getElapsedTime();
    }
  });


  return (
    <mesh ref={meshRef}>
      <circleGeometry args={[radius, 64]} />
      <shaderMaterial
        ref={materialRef}
        transparent
        uniforms={{
          time: { value: 0 },
          radius: { value: radius },
          isLoading: { value: isLoading }
        }}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv - 0.5;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float time;
          uniform float radius;
          uniform bool isLoading;
          varying vec2 vUv;

          void main() {
            if (!isLoading) {
              discard;
            }

            float dist = length(vUv);
            if (dist > 0.5) {
              discard;
            }

            float angle = atan(vUv.y, vUv.x);
            float normalizedAngle = (angle + 3.14159) / (2.0 * 3.14159);
            
            float animationProgress = mod(time * 0.5, 1.0);
            float lineStart = animationProgress;
            float lineEnd = mod(animationProgress + 0.1, 1.0);

            float onLine = 0.0;
            if (lineStart < lineEnd) {
              onLine = float(normalizedAngle > lineStart && normalizedAngle < lineEnd);
            } else {
              onLine = float(normalizedAngle > lineStart || normalizedAngle < lineEnd);
            }

            float lineWidth = 0.01;
            float edgeSmoothing = smoothstep(0.5 - lineWidth, 0.5, dist) - smoothstep(0.5, 0.5 + lineWidth, dist);

            gl_FragColor = vec4(0.0, 1.0, 0.0, onLine * edgeSmoothing);
          }
        `}
      />
    </mesh>
  );
};

export default LoadingSphere;