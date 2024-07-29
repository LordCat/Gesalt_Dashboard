import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { useTexture, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { ProcessedWorldData, preprocessWorldData } from '@/utils/world_data_pre_processing';
import { latLonToVector3, vector3ToLonLat } from '@/utils/PIPutils';
import CountryLabels from './Country_Labels';
import CountryBorders from './Country_Borders';
import { debounce } from '@/utils/debounce';
import { LabelData } from '@/Interfaces/Border_Interfaces';

const Globe: React.FC = () => {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const globeSurfaceRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const labelsRef = useRef<THREE.Group>(null);

  const radius = 1;
  const processedData: ProcessedWorldData = preprocessWorldData(radius);

  const [dayMap, nightMap, cloudMap, specularMap] = useTexture([
    '/assets/textures/8k_day_map.jpg',
    '/assets/textures/8k_night_map.jpg',
    '/assets/textures/8k_clouds.jpg',
    '/assets/textures/8k_specular_map.jpg'
  ]);

  const handlePointerMove = useCallback((event: THREE.Event) => {

    if (globeSurfaceRef.current) {

      const e = event as unknown as MouseEvent;

      

      const x = (e.clientX / window.innerWidth) * 2 - 1;

      const y = -(e.clientY / window.innerHeight) * 2 + 1;

      raycaster.current.setFromCamera(new THREE.Vector2(x, y), camera);

  

      const intersects = raycaster.current.intersectObject(globeSurfaceRef.current);

      

      if (intersects.length > 0) {

        const { point } = intersects[0];

        const nearestCountry = findNearestCountry(point, processedData);

        console.log("Hovered country:", nearestCountry); 

        setHoveredCountry(nearestCountry);

      } else {

        setHoveredCountry(null);

      }

    }

  }, [globeSurfaceRef, raycaster, camera, processedData, setHoveredCountry]);

  

  const findNearestCountry = (point: THREE.Vector3, data: ProcessedWorldData): string | null => {

    let nearestCountry = null;

    let minDistance = Infinity;

  

    data.features.forEach((feature) => {

      if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {

        const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;

        

        polygons.forEach((polygon: number[][][]) => {
          const coordinates = polygon[0]; // Outer ring of the polygon
          let centerPosition = new THREE.Vector3();

          // Calculate center of the polygon

          coordinates.forEach((coord: number[]) => {
            const [lon, lat] = coord;
            const positionVector = latLonToVector3(lat, lon, radius);
            centerPosition.add(positionVector);
          });

          centerPosition.divideScalar(coordinates.length);
          const distance = point.distanceTo(centerPosition);

          if (distance < minDistance) {
            minDistance = distance;
            nearestCountry = feature.properties?.name || null;
          }
        });
      }
    });

    return nearestCountry;
  };

  const isPointInPolygon = (point: number[], vs: number[][]): boolean => {
    const x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      const xi = vs[i][0], yi = vs[i][1];
      const xj = vs[j][0], yj = vs[j][1];
      const intersect = ((yi > y) !== (yj > y))
          && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const debouncedHandlePointerMove = debounce(handlePointerMove, 10);

  useEffect(() => {
    return () => {
      debouncedHandlePointerMove.cancel();
    };
  }, [debouncedHandlePointerMove]);

  const handleCountryClick = useCallback((countryId: string) => {
    setSelectedCountry(prevSelected => prevSelected === countryId ? null : countryId);
  }, []);

  return (
    <>
      <OrbitControls enableZoom={true} enableRotate={true} enablePan={false} />
      <mesh ref={globeSurfaceRef} onPointerMove={debouncedHandlePointerMove}>
        <sphereGeometry args={[radius, 64, 64]} />
        <shaderMaterial
          vertexShader={`
            varying vec2 vUv;
            varying vec3 vNormal;
            void main() {
              vUv = uv;
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform sampler2D dayTexture;
            uniform sampler2D nightTexture;
            uniform sampler2D specularMap;
            uniform vec3 sunDirection;
            varying vec2 vUv;
            varying vec3 vNormal;
            void main() {
              float cosTheta = dot(vNormal, sunDirection);
              vec3 dayColor = texture2D(dayTexture, vUv).rgb;
              vec3 nightColor = texture2D(nightTexture, vUv).rgb;
              float specular = texture2D(specularMap, vUv).r;
              
              float mixValue = smoothstep(-0.2, 0.3, cosTheta);
              vec3 color = mix(nightColor, dayColor, mixValue);
              
              if (cosTheta > 0.0) {
                vec3 reflection = reflect(-sunDirection, vNormal);
                float specularIntensity = pow(max(dot(reflection, vec3(0,0,1)), 0.0), 32.0);
                color += specular * specularIntensity * vec3(1.0);
              }
              
              gl_FragColor = vec4(color, 1.0);
            }
          `}
          uniforms={{
            dayTexture: { value: dayMap },
            nightTexture: { value: nightMap },
            specularMap: { value: specularMap },
            sunDirection: { value: new THREE.Vector3(5, 3, 5).normalize() }
          }}
        />
      </mesh>

      <CountryBorders 
        radius={radius * 1.001} 
        processedData={processedData}
        hoveredCountry={hoveredCountry}
        selectedCountry={selectedCountry}
        countryGeometries={processedData.countryGeometries}
      />

      <CountryLabels
        radius={radius * 1.002}
        processedData={processedData}
        hoveredCountry={hoveredCountry}
        selectedCountry={selectedCountry}
      />
      
      <mesh>
        <sphereGeometry args={[radius * 1.01, 64, 64]} />
        <meshPhongMaterial
          map={cloudMap}
          transparent={true}
          opacity={0.2}
          depthWrite={true}
        />
      </mesh>
    </>
  );
};

export default Globe;