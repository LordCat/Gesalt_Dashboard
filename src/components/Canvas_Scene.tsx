'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import Globe from './RenderLayers/Globe';

interface ClientSideCanvasProps {
  onCountrySelect?: (country: string | null) => void;
}

const ClientSideCanvas: React.FC<ClientSideCanvasProps> = ({ onCountrySelect }) => {
  return (
    <Canvas>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <Globe onCountrySelect={onCountrySelect}/>
    </Canvas>
  );
};

export default ClientSideCanvas;