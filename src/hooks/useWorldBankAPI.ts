import { useState, useEffect } from 'react';
import { getTop20IndicatorsData } from '@/utils/world_bank_api.service';

export const useWorldBankData = (countryLabel: string | null) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!countryLabel) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    const parts = countryLabel.split('|');
    if (parts.length !== 2) {
      setError('Invalid country label format');
      return;
    }

    const isoCode = parts[1].trim();
    console.log('ISO code for selected country:', isoCode); // Debugging log
    setLoading(true);
    setError(null);

    getTop20IndicatorsData(isoCode)
      .then((result: any) => {
        setData(result);
        setLoading(false);
      })
      .catch((err: string) => {
        setError('Failed to fetch data');
        console.error('Failed to Fetch:', err);
        setLoading(false);
      });
  }, [countryLabel]);

  return { data, loading, error };
};