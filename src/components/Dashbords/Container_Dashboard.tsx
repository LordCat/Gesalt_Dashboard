'use client'

import React, { useState } from 'react';
import ClientSideCanvas from '../Canvas_Scene';
import Dashboard from './Globe_Dashboard'; // We'll create this next

const GlobeDashboardContainer = () => {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [dashboardOpen, setDashboardOpen] = useState(false);

  const handleCountrySelect = (country: string) => {
    setSelectedCountry(country);
    setDashboardOpen(true);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <ClientSideCanvas onCountrySelect={handleCountrySelect} />
      <Dashboard 
        country={selectedCountry} 
        isOpen={dashboardOpen}
        onClose={() => setDashboardOpen(false)}
      />
    </div>
  );
};

export default GlobeDashboardContainer;