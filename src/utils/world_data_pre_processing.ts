import * as topojson from 'topojson-client';
import * as THREE from 'three';
import worldDataJson from 'world-atlas/countries-110m.json';
import { Feature, FeatureCollection, Geometry } from 'geojson';
import { createCountryGeometry } from '@/utils/PIPutils';

export interface ProcessedWorldData {
  features: Feature<Geometry>[];
  countryNames: { [id: string]: string };
  countryGeometries: Map<string, THREE.BufferGeometry>;
}

export function preprocessWorldData(radius: number = 1): ProcessedWorldData {
  const worldData = worldDataJson as any;
  const geojson = topojson.feature(worldData, worldData.objects.countries) as unknown as FeatureCollection<Geometry>;
  
  const countryNames: { [id: string]: string } = {};
  const countryGeometries = new Map<string, THREE.BufferGeometry>();

  geojson.features.forEach((feature) => {
    const countryName = feature.properties?.name;
    if (countryName) {
      countryNames[feature.id as string] = countryName;
      countryGeometries.set(countryName, createCountryGeometry(feature, radius));
    }
  });

  return { 
    features: geojson.features,
    countryNames: countryNames,
    countryGeometries: countryGeometries
  };
}