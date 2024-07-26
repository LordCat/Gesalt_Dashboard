import * as topojson from 'topojson-client';
import worldDataJson from 'world-atlas/countries-110m.json';
import { Feature, FeatureCollection, Geometry } from 'geojson';

export interface ProcessedWorldData {
  features: Feature<Geometry>[];
  countryNames: { [id: string]: string };
}

export function preprocessWorldData(): ProcessedWorldData {
  const worldData = worldDataJson as any;
  const geojson = topojson.feature(worldData, worldData.objects.countries) as unknown as FeatureCollection<Geometry>;
  
  const countryNames: { [id: string]: string } = {};
  worldData.objects.countries.geometries.forEach((geometry: any) => {
    countryNames[geometry.id] = geometry.properties.name;
  });

  return { 
    features: geojson.features,
    countryNames: countryNames
  };
}