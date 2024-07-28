import * as THREE from 'three';
import { ProcessedWorldData } from "@/utils/world_data_pre_processing";
import { Position } from "geojson";


//ArcIndex for calcualting the Point in polygon using rbush
export interface ArcIndex {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    arc: Position[];
    polygon: Position[];
    countryId: string;
   
  }

//Interface for the Country Borders render layer. 
export interface CountryBordersProps {
    radius: number;
    processedData: ProcessedWorldData;
    hoveredCountry: string | null;
    selectedCountry: string | null;
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