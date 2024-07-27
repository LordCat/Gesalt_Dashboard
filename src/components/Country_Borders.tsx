import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import {  useFrame, useThree } from '@react-three/fiber';
import RBush from 'rbush';
import { Feature, Geometry } from 'geojson';
import { processPolygon } from '@/utils/PIPutils';
import { ArcIndex, CountryBordersProps } from '@/Interfaces/Border_Interfaces';



const CountryBorders: React.FC<CountryBordersProps> = ({
  radius,
  processedData,
  hoveredCountry,
  selectedCountry,
}) => {
  const { camera } = useThree();
  const linesRef = useRef<THREE.LineSegments>(null);
  
  const projScreenMatrix = useMemo(() => new THREE.Matrix4(), []);
const frustum = useMemo(() => new THREE.Frustum(), []);

const { borderGeometry } = useMemo(() => {
  const index = new RBush<ArcIndex>();
  const allLines: THREE.Vector3[][] = [];
  const featureIndices: number[] = [];
  const indexMap = new Map<string, number>();
  let featureIndex = 0;

  processedData.features.forEach((feature: Feature<Geometry>) => {
    const countryId = feature.id as string;
    const countryName = feature.properties?.name;

    if (countryName) {
      indexMap.set(countryName, featureIndex);
    }

    if (feature.geometry.type === 'Polygon') {
      processPolygon(feature.geometry.coordinates, countryId, index, allLines, radius);
    } else if (feature.geometry.type === 'MultiPolygon') {
      feature.geometry.coordinates.forEach(polygon => 
        processPolygon(polygon, countryId, index, allLines, radius)
      );
    }

    featureIndex++;
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
  geometry.setAttribute('featureIndex', new THREE.Float32BufferAttribute(featureIndices, 1));

  return { arcIndex: index, borderGeometry: geometry, countryIndexMap: indexMap };
}, [processedData, radius]);

  const countryIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    processedData.features.forEach((feature, index) => {
      if (feature.properties?.name) {
        map.set(feature.properties.name, index);
      }
    });
    return map;
  }, [processedData]);

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

  useEffect(() => {
    console.log('Hovered country in CountryBorders:', hoveredCountry);
  }, [hoveredCountry]);

  return (
    <>
      <lineSegments ref={linesRef}>
      <bufferGeometry attach="geometry" {...borderGeometry} />
      <shaderMaterial
        vertexShader={`
          attribute float featureIndex;
          varying float vFeatureIndex;
          varying vec3 vPosition;
          void main() {
            vFeatureIndex = featureIndex;
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 highlightColor;
          uniform vec3 defaultColor;
          uniform vec3 selectedColor;
          uniform float hoveredFeatureIndex;
          uniform float selectedFeatureIndex;
          varying float vFeatureIndex;
          varying vec3 vPosition;
          void main() {
            vec3 color = defaultColor;
            if (vFeatureIndex == hoveredFeatureIndex) {
              color = highlightColor;
            } else if (vFeatureIndex == selectedFeatureIndex) {
              color = selectedColor;
            }
            gl_FragColor = vec4(color, 1.0);
          }
        `}
        uniforms={{
          highlightColor: { value: new THREE.Color(0xff0000) },  // Red for hover
          defaultColor: { value: new THREE.Color(0xffffff) },   // White for default
          selectedColor: { value: new THREE.Color(0x00ff00) },  // Green for selected
          hoveredFeatureIndex: { value: hoveredCountry ? countryIndexMap.get(hoveredCountry) ?? -1 : 1 },
          selectedFeatureIndex: { value: selectedCountry ? countryIndexMap.get(selectedCountry) ?? -1 : 1 },
        }}
      />
    </lineSegments>
      
    </>
  );
};

export default CountryBorders;

