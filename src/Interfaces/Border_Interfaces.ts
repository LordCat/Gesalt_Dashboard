import * as THREE from 'three';
import { ProcessedWorldData } from "@/utils/world_data_pre_processing";
import { Position } from "geojson";

// ArcIndex for calculating the Point in polygon using rbush
export interface ArcIndex {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    arc: Position[];
    polygon: Position[];
    countryId: string;
}

// Updated interface for the Country Borders render layer
export interface CountryBordersProps {
    radius: number;
    processedData: ProcessedWorldData;
    hoveredCountry: string | null;
    selectedCountry: string | null;
    countryGeometries: Map<string, THREE.BufferGeometry>;
}

// New interface for country geometry data
export interface CountryGeometryData {
    geometry: THREE.BufferGeometry;
    name: string;
}

export interface LabelData {
    position: THREE.Vector3;
    text: string;
    normal: THREE.Vector3;
}
  
export interface CountryLabelsProps {
    processedData: ProcessedWorldData;
    radius: number;
    hoveredCountry: string | null;
    selectedCountry: string | null;
}