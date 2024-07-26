'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import Globe from './Globe';

const ClientSideCanvas: React.FC = () => {
  return (
    <Canvas>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <Globe />
    </Canvas>
  );
};

export default ClientSideCanvas;