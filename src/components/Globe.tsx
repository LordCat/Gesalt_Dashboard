import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { useTexture, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import RBush from 'rbush';
import  pointInPolygon   from 'robust-point-in-polygon';

import { FrustumCullingOptimizer } from '@/utils/frustum_culling_optimizer';
import { ProcessedWorldData, preprocessWorldData } from '@/utils/world_data_pre_processing';
import { vector3ToLonLat, getBoundingBox, latLonToVector3 } from '@/utils/PIPutils';

import CountryLabels from './Country_Labels';
import CountryBorders from './Country_Borders';
import { ArcIndex } from '@/Interfaces/Border_Interfaces';
import { Position } from 'geojson';
import { debounce } from '@/utils/debounce';

type Point = [number, number];

const Globe: React.FC = () => {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const frustumOptimizer = useRef(new FrustumCullingOptimizer());
  const globeSurfaceRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const raycaster = useRef(new THREE.Raycaster());

  const processedData = preprocessWorldData();
  const radius = 1; // Adjust this value based on your globe's size
  const arcIndex = useRef(new RBush<ArcIndex>());

  const [dayMap, nightMap, cloudMap, normalMap, specularMap] = useTexture([
    '/assets/textures/8k_day_map.jpg',
    '/assets/textures/8k_night_map.jpg',
    '/assets/textures/8k_clouds.jpg',
    '/assets/textures/8k_normal_map.jpg',
    '/assets/textures/8k_specular_map.jpg'
  ]);


  const insertPolygon = (polygonCoords: Position[][], countryId: string) => {
    polygonCoords.forEach(ring => {
      const bbox = getBoundingBox(ring);
      arcIndex.current.insert({
        ...bbox,
        polygon: ring,
        arc: ring,
        countryId: countryId,
      });
    });
  };

  useEffect(() => {
    processedData.features.forEach((feature) => {
      if (feature.geometry.type === 'Polygon') {
        insertPolygon(feature.geometry.coordinates, feature.id as string);
      } else if (feature.geometry.type === 'MultiPolygon') {
        feature.geometry.coordinates.forEach(polygon => 
          insertPolygon(polygon, feature.id as string)
        );
      }
    });
  }, [processedData]);


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
        setHoveredCountry(nearestCountry);
      } else {
        setHoveredCountry(null);
      }
    }
  }, [globeSurfaceRef, raycaster, camera, processedData]);
  
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
const debouncedHandlePointerMove = useMemo(
  () => debounce(handlePointerMove, 10),  // 200ms debounce time, adjust as needed
  [handlePointerMove]
);

useEffect(() => {
  return () => {
    // This is a cleanup function to cancel any pending debounced calls when the component unmounts
    debouncedHandlePointerMove.cancel();
  };
}, [debouncedHandlePointerMove]);

  const handleCountryClick = useCallback((countryId: string) => {
    setSelectedCountry(prevSelected => prevSelected === countryId ? null : countryId);
  }, []);

  

  return (
    <>
      <OrbitControls enableZoom={true} enableRotate={true} enablePan={false} />
      <mesh ref={globeSurfaceRef} onPointerMove={handlePointerMove}>
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
        radius={radius} 
        processedData={processedData}
        hoveredCountry={hoveredCountry}
        selectedCountry={selectedCountry}
        
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