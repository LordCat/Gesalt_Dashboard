import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CountryBordersProps } from '@/Interfaces/Border_Interfaces';
import { latLonToVector3 } from '@/utils/PIPutils';

const CountryBorders: React.FC<CountryBordersProps> = ({
  radius,
  processedData,
  hoveredCountry,
  selectedCountry,
}) => {
  const linesRef = useRef<THREE.LineSegments>(null);
  const materialRef = useRef<THREE.LineBasicMaterial>(null);
  
  const { borderGeometry, countryIndexMap, countryGeometries } = useMemo(() => {
    const indexMap = new Map<string, number>();
    const positions: number[] = [];
    const featureIndices: number[] = [];
    const geometries = new Map<string, THREE.BufferGeometry>();
  
    processedData.features.forEach((feature, index) => {
      const countryName = feature.properties?.name;
      if (countryName) {
        indexMap.set(countryName, index);
      }
  
      const countryPositions: number[] = [];
  
      const addCoordinate = (coord: number[]) => {
        const correctionFactor = 1.001; // Slight increase to prevent z-fighting
        const vector = latLonToVector3(coord[1], coord[0], radius * correctionFactor);
        positions.push(vector.x, vector.y, vector.z);
        countryPositions.push(vector.x, vector.y, vector.z);
        featureIndices.push(index);
      };
  
      const addPolygon = (polygon: number[][]) => {
        for (let i = 0; i < polygon.length; i++) {
          addCoordinate(polygon[i]);
          if (i < polygon.length - 1) {
            addCoordinate(polygon[i + 1]);
          } else {
            addCoordinate(polygon[0]); // Close the polygon
          }
        }
      };
  
      if (feature.geometry.type === 'Polygon') {
        feature.geometry.coordinates.forEach(addPolygon);
      } else if (feature.geometry.type === 'MultiPolygon') {
        feature.geometry.coordinates.forEach(multiPolygon => {
          multiPolygon.forEach(addPolygon);
        });
      }
  
      if (countryName) {
        const countryGeometry = new THREE.BufferGeometry();
        countryGeometry.setAttribute('position', new THREE.Float32BufferAttribute(countryPositions, 3));
        geometries.set(countryName, countryGeometry);
      }
    });
  
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('featureIndex', new THREE.Float32BufferAttribute(featureIndices, 1));
  
    return { borderGeometry: geometry, countryIndexMap: indexMap, countryGeometries: geometries };
  }, [processedData, radius]);

  useFrame(() => {
    if (materialRef.current && linesRef.current) {
      const hoveredIndex = hoveredCountry ? countryIndexMap.get(hoveredCountry) ?? -1 : -1;
      const selectedIndex = selectedCountry ? countryIndexMap.get(selectedCountry) ?? -1 : -1;
      
      const colors = new Float32Array(borderGeometry.attributes.position.count * 3);
      const positions = new Float32Array(borderGeometry.attributes.position.array);
      
      for (let i = 0; i < borderGeometry.attributes.featureIndex.count; i++) {
        const featureIndex = borderGeometry.attributes.featureIndex.getX(i);
        let color: THREE.Color;
        if (featureIndex === hoveredIndex) {
          color = new THREE.Color(0xff0000); // Red for hovered
          // Elevate the hovered country
          const vector = new THREE.Vector3(
            positions[i * 3],
            positions[i * 3 + 1],
            positions[i * 3 + 2]
          );
          vector.normalize().multiplyScalar(radius * 1.01); // Increase altitude by 1%
          positions[i * 3] = vector.x;
          positions[i * 3 + 1] = vector.y;
          positions[i * 3 + 2] = vector.z;
        } else if (featureIndex === selectedIndex) {
          color = new THREE.Color(0xffff00); // Yellow for selected
        } else {
          color = new THREE.Color(0xffffff); // White for others
        }
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }
      
      linesRef.current.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      linesRef.current.geometry.attributes.position.array.set(positions);
      linesRef.current.geometry.attributes.position.needsUpdate = true;
      linesRef.current.geometry.attributes.color.needsUpdate = true;
    }
  });

  return (
    <lineSegments ref={linesRef} geometry={borderGeometry}>
      <lineBasicMaterial 
        ref={materialRef} 
        vertexColors={true} 
        linewidth={1} 
        depthTest={true}
        depthWrite={true} 
        transparent={false} 
        opacity={0.8}
        side={THREE.DoubleSide}
      />
    </lineSegments>
  );
};

export default CountryBorders;