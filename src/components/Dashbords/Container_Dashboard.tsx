'use client'

import React, { useState } from 'react';
import ClientSideCanvas from '../Canvas_Scene';
import Dashboard from './Globe_Dashboard'; // We'll create this next

const GlobeDashboardContainer = () => {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [dashboardOpen, setDashboardOpen] = useState(false);

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
      />
    </div>
  );
};

export default GlobeDashboardContainer;