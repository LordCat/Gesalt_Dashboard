import React, { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { CountryBordersProps } from '@/Interfaces/Border_Interfaces';

const CountryBorders: React.FC<CountryBordersProps> = ({
  radius,
  processedData,
  hoveredCountry,
  selectedCountry,
  countryGeometries
}) => {
  const [materials, setMaterials] = useState(new Map<string, THREE.LineBasicMaterial>());

  // Create materials for each country
  useEffect(() => {
    const newMaterials = new Map<string, THREE.LineBasicMaterial>();
    countryGeometries.forEach((_, countryName) => {
      newMaterials.set(countryName, new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 }));
    });
    setMaterials(newMaterials);
  }, [countryGeometries]);

  // Update materials based on hover state
  useEffect(() => {
    materials.forEach((material, countryName) => {
      if (countryName === hoveredCountry) {
        material.color.setHex(0xff0000); // Red for hovered
      } else if (countryName === selectedCountry) {
        material.color.setHex(0x00ff00); // Green for selected (if you want to keep this feature)
      } else {
        material.color.setHex(0xffffff); // White for others
      }
      material.needsUpdate = true;
    });
  }, [hoveredCountry, selectedCountry, materials]);

  return (
    <group>
      {Array.from(countryGeometries).map(([countryName, geometry]) => (
        <lineSegments key={countryName} geometry={geometry} material={materials.get(countryName)} />
      ))}
    </group>
  );
};

export default CountryBorders;