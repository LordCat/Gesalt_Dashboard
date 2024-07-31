import React from 'react';

interface DashboardProps {
  country: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ country, isOpen, onClose }) => {
  return (
    <div 
      className={`absolute top-0 left-0 h-full w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
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
        <h2 className="text-2xl font-bold mb-4">{country}</h2>
        {/* Add country stats here */}
        <h1>Dr. Placeholder was here</h1>
      </div>
    </div>
  );
};

export default Dashboard;