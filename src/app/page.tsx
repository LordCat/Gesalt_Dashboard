
import dynamic from 'next/dynamic';
import ClientSideCanvas from '@/components/Canvas_Scene';

//const GlobeWithNoSSR = dynamic(() => import('../components/Globe'), { ssr: false });

export default function Home() {

 

 

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ClientSideCanvas />
    </div>
  );
}