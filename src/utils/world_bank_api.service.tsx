import axios from 'axios';
import { WorldBankIndictors } from '@/enums/world_bank_indicators';
import { format } from 'path';

const WORLD_BANK_API_BASE_URL = 'https://api.worldbank.org/v2';
const CAHCE_DURATION = 30 * 24 * 60 * 60 * 1000;


interface CachedData {
    data: any;
    timestamp: number;
}

const cache: { [key: string]: { data: any; timestamp: number}} = {};

//Api call and cache.
const fetchWithCache = async (url: string): Promise<any> => {
    if (cache[url] && Date.now() - cache[url].timestamp < CAHCE_DURATION){
        return cache[url].data;
    }

    try {
        const response = await axios.get(url, {
            params: {format: 'json', per_page: 100 } 
        });

        const data = response.data[1];
        
        cache[url] = { data, timestamp: Date.now() };
        return data;
    } catch (error) {
        console.error('Error fetching data: ', error);
        throw error;
    }
}

export const getCountryData = (isoCode: string): Promise<any> =>
    fetchWithCache(`${WORLD_BANK_API_BASE_URL}/country/${isoCode}`);
  
  export const getIndicatorData = (isoCode: string, indicator: WorldBankIndictors): Promise<any> =>
    fetchWithCache(`${WORLD_BANK_API_BASE_URL}/country/${isoCode}/indicator/${indicator}`);
  
  export const getTop20IndicatorsData = async (isoCode: string): Promise<{ [key in WorldBankIndictors]?: any }> => {
    const indicatorPromises = Object.values(WorldBankIndictors).map(indicator => 
      getIndicatorData(isoCode, indicator).then(data => ({ [indicator]: data }))
    );
    const results = await Promise.all(indicatorPromises);
    return Object.assign({}, ...results);
  };
  
  export const clearCache = (): void => {
    Object.keys(cache).forEach(key => delete cache[key]);
  };




