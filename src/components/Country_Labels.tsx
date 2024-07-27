import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { ProcessedWorldData } from '@/utils/world_data_pre_processing';
import { latLonToVector3, calculatePolygonArea } from '@/utils/PIPutils';

interface LabelData {
  position: THREE.Vector3;
  text: string;
  normal: THREE.Vector3;
}

interface CountryLabelsProps {
  processedData: ProcessedWorldData;
  radius: number;
  hoveredCountry: string | null;
  selectedCountry: string | null;
}

const CountryLabels: React.FC<CountryLabelsProps> = ({ processedData, radius, hoveredCountry, selectedCountry}) => {
  const labelsRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  const frustum = useMemo(() => new THREE.Frustum(), []);
  const projScreenMatrix = useMemo(() => new THREE.Matrix4(), []);

  const labelData: LabelData[] = useMemo(() => {
    return processedData.features.map((feature) => {
      const { properties, geometry } = feature;
      const name = properties?.name || 'Unknown';
      let centerPosition: THREE.Vector3;
      let normal: THREE.Vector3;
  
      if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
        let largestPolygon: number[][] = [];
        let maxArea = 0;
  
        const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
        
        polygons.forEach((polygon: number[][][]) => {
          const coordinates = polygon[0]; // Outer ring of the polygon
          const area = calculatePolygonArea(coordinates);
          if (area > maxArea) {
            maxArea = area;
            largestPolygon = coordinates;
          }
        });
  
        let totalLon = 0, totalLat = 0;
        largestPolygon.forEach((coord: number[]) => {
          totalLon += coord[0];
          totalLat += coord[1];
        });
        const avgLon = totalLon / largestPolygon.length;
        const avgLat = totalLat / largestPolygon.length;
        centerPosition = latLonToVector3(avgLat, avgLon, radius * 1.001); // Slightly above surface
        normal = centerPosition.clone().normalize();
      } else {
        centerPosition = new THREE.Vector3();
        normal = new THREE.Vector3(0, 1, 0);
      }
  
      return { position: centerPosition, text: name, normal };
    });
  }, [processedData, radius]);
  

  useFrame(() => {
    if (labelsRef.current) {
      projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      frustum.setFromProjectionMatrix(projScreenMatrix);
      
      labelsRef.current.children.forEach((child) => {
        const label = child as THREE.Object3D;
        const labelData = label.userData as LabelData;
        
        const isInFrustum = frustum.containsPoint(labelData.position);
        if (isInFrustum) {
          // Billboard effect while maintaining upright orientation
          const worldPosition = new THREE.Vector3();
          label.getWorldPosition(worldPosition);
          const cameraPosition = camera.position.clone();
          const up = worldPosition.clone().normalize();
          const cameraDirection = cameraPosition.sub(worldPosition).normalize();
          const right = up.clone().cross(cameraDirection).normalize();
          const billboardRotation = new THREE.Matrix4().makeBasis(right, up, cameraDirection.negate());
          label.quaternion.copy(camera.quaternion);
  
          // Visibility check
          const dotProduct = up.dot(cameraDirection);
          label.visible = dotProduct < 0;
  
          // Dynamic scaling
          const distance = camera.position.distanceTo(labelData.position);
          const scale = Math.max(0.5, Math.min(2, 10 / distance));
          label.scale.setScalar(scale);
        } else {
          label.visible = false;
        }
      });
    }
  });

  return (
    <group ref={labelsRef}>
      {labelData.map((data, index) => (
        <group key={index} position={data.position} userData={data}>
          <Text
            fontSize={0.007 * radius}
            color={data.text === hoveredCountry ? "yellow" : data.text === selectedCountry ? "red" : "white"}
            anchorX="center"
            anchorY="middle"
            renderOrder={2}
          >
            {data.text}
            <meshBasicMaterial 
              attach="material" 
              side={THREE.DoubleSide}  
              depthTest={false} 
              transparent
              opacity={data.text === hoveredCountry || data.text === selectedCountry ? 1 : 0.8}
            />
          </Text>
        </group>
      ))}
    </group>
  );
};

export default CountryLabels;