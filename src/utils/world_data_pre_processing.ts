import * as topojson from 'topojson-client';
import * as THREE from 'three';
import worldDataJson from 'world-atlas/countries-110m.json';
import { Feature, FeatureCollection, Geometry } from 'geojson';
import { createCountryGeometry } from '@/utils/PIPutils';
import { CountryCode } from '@/enums/countyISO-1_TO_3.enum';



export interface ProcessedWorldData {
  features: Feature<Geometry>[];
  countryNames: { [id: string]: string };
  countryGeometries: Map<string, THREE.BufferGeometry>;
}

function getISOCode(numericCode: string): string {
  const isoCode = Object.keys(CountryCode).find(key => CountryCode[key as keyof typeof CountryCode] === numericCode);
  return isoCode || '';
}

export function preprocessWorldData(radius: number = 1): ProcessedWorldData {
  const worldData = worldDataJson as any;
  const geojson = topojson.feature(worldData, worldData.objects.countries) as unknown as FeatureCollection<Geometry>;
  
  const countryNames: { [id: string]: string } = {};
  const countryGeometries = new Map<string, THREE.BufferGeometry>();

  geojson.features.forEach((feature) => {
    const countryName = feature.properties?.name;
    const numericCode = feature.id as string;
    const isoCode = getISOCode(numericCode);

    
    if (countryName && isoCode) {
      const nameWithIso = `${countryName} | ${isoCode}`
      countryNames[feature.id as string] = nameWithIso;
      countryGeometries.set(nameWithIso, createCountryGeometry(feature, radius));
    }
  });

  return { 
    features: geojson.features,
    countryNames: countryNames,
    countryGeometries: countryGeometries
  };
}