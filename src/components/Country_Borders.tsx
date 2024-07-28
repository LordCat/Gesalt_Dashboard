import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import {  useFrame, useThree } from '@react-three/fiber';
import { processPolygon } from '@/utils/PIPutils';
import { CountryBordersProps } from '@/Interfaces/Border_Interfaces';



const CountryBorders: React.FC<CountryBordersProps> = ({
  radius,
  processedData,
  hoveredCountry,
  selectedCountry,
}) => {
  console.log("CountryBorders - hoveredCountry:", hoveredCountry);
  const { camera } = useThree();
  const linesRef = useRef<THREE.LineSegments>(null);
  const materialRef = useRef<THREE.LineBasicMaterial>(null);
  
  const hoveredCountryRef = useRef(hoveredCountry);
  const selectedCountryRef = useRef(selectedCountry)

  const projScreenMatrix = useMemo(() => new THREE.Matrix4(), []);
  const frustum = useMemo(() => new THREE.Frustum(), []);

  const { borderGeometry, countryIndexMap } = useMemo(() => {
    const indexMap = new Map<string, number>();
    const positions: number[] = [];
    const featureIndices: number[] = [];
    
    processedData.features.forEach((feature, index) => {
      const countryName = feature.properties?.name;
      if (countryName) {
        indexMap.set(countryName, index);
      }
  
      if (feature.geometry.type === 'Polygon') {
        processPolygon(feature.geometry.coordinates, index, positions, featureIndices, radius);
      } else if (feature.geometry.type === 'MultiPolygon') {
        feature.geometry.coordinates.forEach(polygon => 
          processPolygon(polygon, index, positions, featureIndices, radius)
        );
      }
    });
  
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('featureIndex', new THREE.Float32BufferAttribute(featureIndices, 1));
  
    return { borderGeometry: geometry, countryIndexMap: indexMap };
  }, [processedData, radius]);

  
  useFrame(() => {
    if (materialRef.current && linesRef.current) {
      const hoveredIndex = hoveredCountry ? countryIndexMap.get(hoveredCountry) ?? -1 : -1;
      
      linesRef.current.geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(borderGeometry.attributes.position.count * 3), 3));
      const colors = linesRef.current.geometry.attributes.color as THREE.BufferAttribute;
      
      for (let i = 0; i < borderGeometry.attributes.featureIndex.count; i++) {
        const featureIndex = borderGeometry.attributes.featureIndex.getX(i);
        const color = featureIndex === hoveredIndex ? new THREE.Color(0xff0000) : new THREE.Color(0xffffff);
        colors.setXYZ(i, color.r, color.g, color.b);
      }
      
      colors.needsUpdate = true;
    }
  });

  return (
    <>
      <lineSegments ref={linesRef} geometry={borderGeometry}>
      <lineBasicMaterial ref={materialRef} vertexColors={true} linewidth={2} />
    </lineSegments>
      
    </>
  );
};
export default CountryBorders;

