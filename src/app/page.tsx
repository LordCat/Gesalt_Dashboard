
import GlobeDashboardContainer from '@/components/Dashboard/Container_Dashboard';

//const GlobeWithNoSSR = dynamic(() => import('../components/Globe'), { ssr: false });

export default function Home() {

 
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <GlobeDashboardContainer />
    </div>
  );
}