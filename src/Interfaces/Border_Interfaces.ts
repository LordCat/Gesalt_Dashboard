import { FrustumCullingOptimizer } from "@/utils/frustum_culling_optimizer";
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