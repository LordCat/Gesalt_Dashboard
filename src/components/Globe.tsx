'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {  ThreeEvent, useThree } from '@react-three/fiber';
import { useTexture, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

import { FrustumCullingOptimizer } from '@/utils/frustum_culling_optimizer';
import {  preprocessWorldData } from '@/utils/world_data_pre_processing';

import CountryLabels from './Country_Labels';
import CountryBorders from './Country_Borders';
import { vector3ToLonLat } from '@/utils/PIPutils';

const Globe: React.FC = () => {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const frustumOptimizer = useRef(new FrustumCullingOptimizer());
  const { camera } = useThree();

  const processedData = preprocessWorldData();
  


  const [dayMap, nightMap, cloudMap, normalMap, specularMap] = useTexture([
    '/assets/textures/8k_day_map.jpg',
    '/assets/textures/8k_night_map.jpg',
    '/assets/textures/8k_clouds.jpg',
    '/assets/textures/8k_normal_map.jpg',
    '/assets/textures/8k_specular_map.jpg'
  ]);

  // Load TopoJSON data
  

  const handlePointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (globeSurfaceRef.current) {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
  
      const intersects = raycaster.intersectObject(globeSurfaceRef.current);
      
      if (intersects.length > 0) {
        const { point } = intersects[0];
        const [lon, lat] = vector3ToLonLat(point, radius);
        
        const tolerance = 0.5; // Adjust based on your needs
        const nearbyArcs = arcIndex.search({
          minX: lon - tolerance,
          minY: lat - tolerance,
          maxX: lon + tolerance,
          maxY: lat + tolerance
        });
  
        let closestDistance = Infinity;
        let closestCountryId: string | null = null;
  
        nearbyArcs.forEach(item => {
          const distance = pointToArcDistance([lon, lat], item.arc);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestCountryId = item.countryId;
          }
        });
  
        // Add a threshold to determine if the point is close enough to be considered "inside" a country
        const hoverThreshold = 0.1; // Adjust this value as needed
        if (closestDistance <= hoverThreshold) {
          const countryName = closestCountryId ? processedData.countryNames[closestCountryId] : null;
          onCountryHover(countryName);
        } else {
          onCountryHover(null);
        }
      } else {
        onCountryHover(null);
      }
    }
  }, [globeSurfaceRef, raycaster, camera, radius, arcIndex, onCountryHover, processedData.countryNames]);

  useEffect(() => {
    frustumOptimizer.current.updateFrustum(camera);
  }, [camera]);


  if (!preprocessWorldData) {
    return null; // or a loading indicator
  }

  return (
    <>
      <OrbitControls enableZoom={true} enableRotate={true} enablePan={false} />
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
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
        radius={1.001} 
        processedData={processedData}
        onCountryHover={handleCountryHover}
        onCountryClick={handleCountryClick}
        hoveredCountry={hoveredCountry}
        selectedCountry={selectedCountry}
        frustumOptimizer={frustumOptimizer.current}
      />

<CountryLabels
        radius={1.002}
        processedData={processedData}
        hoveredCountry={hoveredCountry}
        selectedCountry={selectedCountry}
      />
      
      <mesh>
        <sphereGeometry args={[1.01, 64, 64]} />
        <meshPhongMaterial
          map={cloudMap}
          transparent={true}
          opacity={0.4}
          depthWrite={true}
        />
      </mesh>
    </>
  );
};

export default Globe;