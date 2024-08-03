import axios, { AxiosError } from 'axios';
import { WorldBankIndicators } from '@/enums/world_bank_indicators';

const WORLD_BANK_API_BASE_URL = 'https://api.worldbank.org/v2';
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days
const REQUEST_DELAY = 333; // milliseconds, for approximately 3 requests per second

interface CachedData {
    data: any;
    timestamp: number;
}

const cache: { [key: string]: CachedData } = {};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithCache = async (url: string): Promise<any> => {
    if (cache[url] && Date.now() - cache[url].timestamp < CACHE_DURATION) {
        return cache[url].data;
    }

    await delay(REQUEST_DELAY); // Polite delay before each request

    try {
        const response = await axios.get(url, {
            params: { format: 'json', per_page: 1, mrnev: 1 }
        });

        const data = response.data[1];
        
        cache[url] = { data, timestamp: Date.now() };
        return data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            if (axiosError.response) {
                console.error('Error response:', axiosError.response.data);
                console.error('Error status:', axiosError.response.status);
                console.error('Error headers:', axiosError.response.headers);
            } else if (axiosError.request) {
                console.error('Error request:', axiosError.request);
            } else {
                console.error('Error message:', axiosError.message);
            }
            if (axiosError.code === 'ERR_NETWORK') {
                console.error('Network error. This might be due to CORS issues.');
            }
        } else {
            console.error('Unexpected error:', error);
        }
        throw error;
    }
}

export const getCountryData = (isoCode: string): Promise<any> =>
    fetchWithCache(`${WORLD_BANK_API_BASE_URL}/country/${isoCode}`);

export const getIndicatorData = (isoCode: string, indicator: WorldBankIndicators): Promise<any> =>
    fetchWithCache(`${WORLD_BANK_API_BASE_URL}/country/${isoCode}/indicator/${indicator}`);

export const getTop20IndicatorsData = async (isoCode: string): Promise<{ [key in WorldBankIndicators]?: any }> => {
    const cacheKey = `top20_${isoCode}`;
    
    if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_DURATION) {
        return cache[cacheKey].data;
    }

    const indicatorPromises = Object.values(WorldBankIndicators).map(async (indicator, index) => {
        await delay(index * REQUEST_DELAY); // Stagger requests
        const data = await getIndicatorData(isoCode, indicator);
        return { [indicator]: data };
    });

    const results = await Promise.all(indicatorPromises);
    const combinedData = Object.assign({}, ...results);
    
    cache[cacheKey] = { data: combinedData, timestamp: Date.now() };
    return combinedData;
};

export const clearCache = (): void => {
    Object.keys(cache).forEach(key => delete cache[key]);
};
