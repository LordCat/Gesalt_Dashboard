'use client'

import React, { useState } from 'react';
import ClientSideCanvas from '@/components/Canvas_Scene';
import Dashboard from '@/components/Dashbords/Container_Dashboard';
import { useWorldBankData } from '@

const GlobeDashboardContainer = () => {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const { data, loading, error } = useWorldBankData(selectedCountry);

  const handleCountrySelect = (country: string | null) => {
    setSelectedCountry(country);
    setDashboardOpen(!!country);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <ClientSideCanvas onCountrySelect={handleCountrySelect} />
      <Dashboard 
        country={selectedCountry}
        isOpen={dashboardOpen}
        onClose={() => { 
          setSelectedCountry(null);
          setDashboardOpen(false);
        }}
        data={data}
        loading={loading}
        error={error}
      />
    </div>
  );
};

export default GlobeDashboardContainer;