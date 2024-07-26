import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { ProcessedWorldData } from '@/utils/world_data_pre_processing';
import { latLonToVector3 } from '@/utils/PIPutils';

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
        const coordinates = geometry.type === 'Polygon' ? geometry.coordinates[0] : geometry.coordinates[0][0];
        let totalLon = 0, totalLat = 0;
        coordinates.forEach((coord: number[]) => {
          totalLon += coord[0];
          totalLat += coord[1];
        });
        const avgLon = totalLon / coordinates.length;
        const avgLat = totalLat / coordinates.length;
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
      // Update frustum
      projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      frustum.setFromProjectionMatrix(projScreenMatrix);
      
      labelsRef.current.children.forEach((child) => {
        const label = child as THREE.Object3D;
        const labelData = label.userData as LabelData;
        
        // Check if label is in frustum
        const isInFrustum = frustum.containsPoint(labelData.position);
        if (!isInFrustum) {
          return;
        } else {
          label.visible = isInFrustum;
          // Update label size based on camera distance
          const distance = camera.position.distanceTo(labelData.position);
          const scale = Math.max(0.5, Math.min(2, 10 / distance));
          label.scale.setScalar(scale);

          // Orient label to be tangent to the globe surface
          const up = labelData.position.clone().normalize();
          const axis = new THREE.Vector3(0, 1, 1).cross(up).normalize();
          const radians = Math.acos(new THREE.Vector3(0, 0, 1).dot(up));
          label.quaternion.setFromAxisAngle(axis, radians);

          // Rotate label to align with longitude lines
          const longitude = Math.atan2(labelData.position.x, labelData.position.z);
          label.rotateOnAxis(new THREE.Vector3(0, 1, 0), longitude);
        }
      });
    }
  });

  return (
    <group ref={labelsRef}>
      {labelData.map((data, index) => (
        <group key={index} position={data.position} userData={data}>
          <Text
            text={data.text}
            fontSize={0.007 * radius}
            color="white"
            anchorX="center"
            anchorY="middle"
            renderOrder={1}
          >
            
            <meshBasicMaterial attach="material" side={THREE.DoubleSide} depthTest={false} />
          </Text>
        </group>
      ))}
    </group>
  );
};

export default CountryLabels;