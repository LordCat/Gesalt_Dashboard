import { useWorldBankData } from '@/hooks/useWorldBankAPI';
import React from 'react';
import { WorldBankIndicators, getIndicatorLabel, formatIndicatorValue } from '@/enums/world_bank_indicators';

interface DashboardProps {
  country: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ country, isOpen, onClose }) => {
  const { data, loading, error } = useWorldBankData(country);
  
  const renderIndicator = (indicator: WorldBankIndicators, value: any) => {
    if (!value || value.length === 0) return null;
    const latestData = value[0];
    return (
      <div key={indicator} className="mb-2">
        <strong>{getIndicatorLabel(indicator)}:</strong> {formatIndicatorValue(indicator, latestData.value)} ({latestData.date})
      </div>
    );
  };

  const getCountryName = (countryLabel: string | null) => {
    if (!countryLabel) return 'No country selected';
    return countryLabel.split('|')[0].trim();
  };

  return (
    <div 
      className={`absolute top-0 left-0 h-full w-80 transparent shadow-lg transform transition-transform duration-300 ease-in-out overflow-y-auto ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <button 
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        onClick={onClose}
      >
        Close
      </button>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">{getCountryName(country)}</h2>
          {loading && <p>Loading...</p>}
          {error && <p>Error: {error}</p>}
          {data && (
            <div>
              {Object.entries(data).map(([indicator, value]) => 
                renderIndicator(indicator as WorldBankIndicators, value)
              )}
            </div>
          )}
          {!loading && !error && !data && <p>Select a country to view data</p>}
      </div>
    </div>
  );
};

export default Dashboard;