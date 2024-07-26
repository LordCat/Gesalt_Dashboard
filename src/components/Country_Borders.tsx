import React, { useCallback, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import RBush from 'rbush';
import { Feature, Geometry } from 'geojson';
import { processPolygon, vector3ToLonLat,  pointToArcDistance, latLonToVector3} from '@/utils/PIPutils';
import { ArcIndex, CountryBordersProps } from '@/Interfaces/Border_Interfaces';


const CountryBorders: React.FC<CountryBordersProps> = ({
  radius,
  processedData,
  onCountryHover,
  onCountryClick,
  hoveredCountry,
  selectedCountry,
  
}) => {
  const { camera, raycaster } = useThree();
  const linesRef = useRef<THREE.LineSegments>(null);
  const globeSurfaceRef = useRef<THREE.Mesh>(null);
  const projScreenMatrix = useMemo(() => new THREE.Matrix4(), []);
const frustum = useMemo(() => new THREE.Frustum(), []);

  const { arcIndex, borderGeometry } = useMemo(() => {
    const index = new RBush<ArcIndex>();
    const allLines: THREE.Vector3[][] = [];

    processedData.features.forEach((feature: Feature<Geometry>) => {
      const countryId = feature.id as string;
      if (feature.geometry.type === 'Polygon') {
        processPolygon(feature.geometry.coordinates, countryId, index, allLines, radius);
      } else if (feature.geometry.type === 'MultiPolygon') {
        feature.geometry.coordinates.forEach(polygon => 
          processPolygon(polygon, countryId, index, allLines, radius)
        );
      }
    });

    // Create geometry for Three.js
    const positions: number[] = [];
    allLines.forEach(line => {
      for (let i = 0; i < line.length - 1; i++) {
        positions.push(line[i].x, line[i].y, line[i].z);
        positions.push(line[i + 1].x, line[i + 1].y, line[i + 1].z);
      }
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    return { arcIndex: index, borderGeometry: geometry };
  }, [processedData, radius]);


  useFrame(() => {
    if (linesRef.current) {
      projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      frustum.setFromProjectionMatrix(projScreenMatrix);

      const positions = linesRef.current.geometry.attributes.position.array;
      const visibility = new Float32Array(positions.length / 3);
      
      for (let i = 0; i < positions.length; i += 3) {
        const point = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
        visibility[i / 3] = frustum.containsPoint(point) ? 1 : 0;
      }
      
      linesRef.current.geometry.setAttribute('visibility', new THREE.BufferAttribute(visibility, 1));
      linesRef.current.geometry.attributes.visibility.needsUpdate = true;
    }
  });

  return (
    <>
    
      <lineSegments ref={linesRef}>
        <bufferGeometry attach="geometry" {...borderGeometry} />
        <shaderMaterial
          vertexShader={`
            attribute float visibility;
            varying float vVisibility;
            varying vec3 vPosition;
            void main() {
              vVisibility = visibility;
              vPosition = position;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform vec3 highlightColor;
            uniform vec3 defaultColor;
            uniform vec3 selectedColor;
            uniform float highlightStrength;
            uniform vec3 hoverPosition;
            varying float vVisibility;
            varying vec3 vPosition;
            void main() {
              if (vVisibility < 0.5) discard;
              float highlight = smoothstep(0.99, 1.0, length(vPosition));
              vec3 color = mix(defaultColor, highlightColor, highlight * highlightStrength);
              color = mix(color, selectedColor, float(highlightStrength > 0.99));
              if (distance(vPosition, hoverPosition) < 0.01) {
                color = highlightColor;
              }
              gl_FragColor = vec4(color, 1.0);
            }
          `}
          uniforms={{
            highlightColor: { value: new THREE.Color(0xffff00) },
            defaultColor: { value: new THREE.Color(0xffffff) },
            selectedColor: { value: new THREE.Color(0xff0000) },
            hoverPosition: { 
              value: hoveredCountry 
                ? (() => {
                    const feature = processedData.features.find(f => f.properties?.name === hoveredCountry);
                    if (feature && feature.geometry.type === 'Polygon') {
                      const [lon, lat] = feature.geometry.coordinates[0][0];
                      return latLonToVector3(lat, lon, radius);
                    }
                    return new THREE.Vector3();
                  })()
                : new THREE.Vector3()
            },
            highlightStrength: { value: hoveredCountry ? 1.0 : (selectedCountry ? 0.5 : 0.0) },
          }}
        />
      </lineSegments>
      <mesh ref={globeSurfaceRef} onPointerMove={handlePointerMove}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshBasicMaterial transparent opacity={0.01} side={THREE.DoubleSide} />
      </mesh>

    </>
  );
};

export default CountryBorders;