import { FrustumCullingOptimizer } from "@/utils/frustum_culling_optimizer";
import { ProcessedWorldData } from "@/utils/world_data_pre_processing";
//ArcIndex for calcualting the Point in polygon using rbush
export interface ArcIndex {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    arc: number[][];
    countryId: string;
  }

//Interface for the Country Borders render layer. 
export interface CountryBordersProps {
    radius: number;
    processedData: ProcessedWorldData;
    onCountryHover: (countryName: string | null) => void;
    onCountryClick: (countryName: string) => void;
    hoveredCountry: string | null;
    selectedCountry: string | null;
    frustumOptimizer: FrustumCullingOptimizer;
  }