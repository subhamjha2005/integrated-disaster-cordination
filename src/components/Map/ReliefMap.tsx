'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/UI/Skeleton';

// Because React-Leaflet requires the window object (which isn't available during SSR),
// we dynamically import the Map component and disable SSR.
const MapClient = dynamic(() => import('./MapClient'), {
  ssr: false,
  loading: () => (
    <div className="glass-panel w-full h-full animate-pulse flex items-center justify-center">
      <p className="text-neutral-500 font-medium">Loading geospatial data...</p>
    </div>
  )
});

export function ReliefMap({ centerCoords, className, rawContainer = false }: { centerCoords?: [number, number]; className?: string; rawContainer?: boolean }) {
  return (
    <div className={className || (rawContainer ? "w-full h-full min-h-[350px] relative overflow-hidden" : "glass-panel w-full h-full min-h-[350px] relative overflow-hidden")}>
      <MapClient centerCoords={centerCoords} />
    </div>
  );
}

