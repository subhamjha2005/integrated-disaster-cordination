'use client';

import { useAppStore } from '@/store/useAppStore';
import {
   ShieldCheck,
   MapPin,
   Truck,
   AlertTriangle,
   Activity,
   Package,
   Clock,
   Navigation,
   Database,
   Maximize2,
   Radio,
   CloudRain,
   Thermometer,
   Wind,
   Gauge
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ReliefMap } from '@/components/Map/ReliefMap';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { LiveTelemetryStream } from '@/components/UI/LiveTelemetryStream';
import { fetchLiveTelemetry, LiveTelemetryData } from '@/lib/disasterApi';

export default function GovernmentFleetUI() {
   const { camps } = useAppStore();
   const [telemetry, setTelemetry] = useState<LiveTelemetryData | null>(null);

   // Fetch and refresh live atmospheric telemetry
   useEffect(() => {
      let isMounted = true;
      async function loadMetrics() {
         const data = await fetchLiveTelemetry(26.1388, 91.6625);
         if (isMounted && data) {
            setTelemetry(data);
         }
      }
      loadMetrics();
      const interval = setInterval(loadMetrics, 45000);
      return () => {
         isMounted = false;
         clearInterval(interval);
      };
   }, []);

   // Simulated Active Deployments
   const [deployments] = useState([
      { id: 'DP-0912', volunteer: 'Rohan Sharma', origin: 'AEC Hub', destination: 'Jalukbari Center', status: 'transit', eta: '5 mins', cargo: 'Water Purifiers', progress: 85 },
      { id: 'DP-0914', volunteer: 'Dr. Bishnu Borah', origin: 'GU Supply', destination: 'AEC Medical Tent', status: 'transit', eta: '12 mins', cargo: 'Trauma Kits', progress: 40 },
      { id: 'DP-0918', volunteer: 'Jiten Kalita', origin: 'City Outskirts', destination: 'GU Hub', status: 'traffic', eta: '25 mins', cargo: 'Generators', progress: 15 },
   ]);

   const renderMapContent = () => (
      <div className="flex-1 w-full h-full relative overflow-hidden flex flex-col">
         {/* Map Header Bar */}
         <div className="px-6 py-3.5 bg-neutral-900/90 border-b border-white/10 flex flex-wrap justify-between items-center backdrop-blur-md z-10 gap-3 shrink-0">
            <div className="flex items-center space-x-3">
               <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center">
                  <Navigation className="w-4 h-4 mr-2 text-indigo-400 animate-pulse" />
                  Live Fleet & Tactical Telemetry Map
               </h3>
               <span className="hidden sm:inline-block text-[9px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded">
                  GPS ACTIVE
               </span>
            </div>

            {/* Live Environmental Quick Telemetry Pills */}
            {telemetry && (
               <div className="hidden md:flex items-center space-x-2 text-[10px] font-mono">
                  <div className="flex items-center space-x-1 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                     <Thermometer className="w-3 h-3 text-amber-400" />
                     <span className="text-white font-bold">{telemetry.temperature}°C</span>
                  </div>
                  <div className="flex items-center space-x-1 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                     <CloudRain className="w-3 h-3 text-cyan-400" />
                     <span className="text-white font-bold">{telemetry.rain} mm</span>
                  </div>
                  <div className="flex items-center space-x-1 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                     <Wind className="w-3 h-3 text-indigo-400" />
                     <span className="text-white font-bold">{telemetry.windSpeed} km/h</span>
                  </div>
                  <div className="flex items-center space-x-1 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                     <Gauge className="w-3 h-3 text-emerald-400" />
                     <span className="text-white font-bold">{Math.round(telemetry.pressure)} hPa</span>
                  </div>
               </div>
            )}

            {/* Status & Fullscreen Controls */}
            <div className="flex items-center space-x-3">
               <button
                  onClick={() => window.open('/map-fullscreen', '_blank')}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg cursor-pointer"
                  title="Fullscreen Map"
               >
                  <Maximize2 className="w-3.5 h-3.5 text-white" />
                  <span>Fullscreen</span>
               </button>
            </div>
         </div>

         {/* Map View Canvas */}
         <div className="flex-1 w-full h-full relative min-h-[350px]">
            <ReliefMap />
         </div>
      </div>
   );

   return (
      <DashboardLayout>
         <div className="min-h-[calc(100vh-8rem)] flex flex-col xl:flex-row gap-6">

            {/* Left Side: Fleet Map (Standard Inline View) */}
            <div className="flex-1 glass-panel rounded-3xl overflow-hidden flex flex-col relative border border-white/5 shadow-2xl min-h-[450px]">
               {renderMapContent()}
            </div>

            {/* Right Side: Data & Telemetry Panels */}
            <div className="w-full xl:w-[420px] flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2 pb-10 xl:pb-0">

                  {/* 1. Live Open-Meteo Telemetry Stream */}
                  <LiveTelemetryStream />

                  {/* 2. Camp Inventory Progress Bars */}
                  <div className="glass-panel rounded-3xl p-6 border border-white/5">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center">
                           <Package className="w-4 h-4 text-sapphire mr-2" />
                           Camp Inventory Levels
                        </h3>
                        <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest">
                           {camps.length} Hubs Monitored
                        </span>
                     </div>

                     <div className="space-y-6">
                        {camps.map(camp => {
                           const currentOcc = camp.currentOccupancy || 1;
                           const waterPct = Math.max(10, Math.min(100, Math.floor(((camp.supplies?.water || 500) / currentOcc) * 100)));
                           const foodPct = Math.max(10, Math.min(100, Math.floor(((camp.supplies?.food || 800) / currentOcc) * 100)));
                           const medPct = Math.max(5, Math.min(100, Math.floor(((camp.supplies?.medical || 200) / (currentOcc * 0.1)) * 100)));

                           return (
                              <div key={camp.id} className="bg-navy-panel/50 p-4 rounded-2xl border border-white/5">
                                 <div className="flex justify-between items-center mb-4">
                                    <p className="text-xs font-bold text-white uppercase tracking-wider">{camp.name}</p>
                                    <span className="text-[9px] font-mono text-powder bg-powder/10 px-2 py-0.5 rounded border border-powder/20">
                                       {camp.status}
                                    </span>
                                 </div>
                                 <div className="space-y-3">
                                    <ProgressBar label="Water Reserves" percentage={waterPct} />
                                    <ProgressBar label="Food Rations" percentage={foodPct} />
                                    <ProgressBar label="Medical Stock" percentage={medPct} />
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  </div>

                  {/* 3. Active Deployments */}
                  <div className="glass-panel rounded-3xl p-6 border border-white/5 flex-1">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center">
                           <Truck className="w-4 h-4 text-sapphire mr-2" />
                           Active Logistics Deployments
                        </h3>
                        <span className="bg-sapphire/10 text-powder px-2 py-0.5 rounded text-[10px] font-black">
                           {deployments.length} Active
                        </span>
                     </div>

                     <div className="space-y-4">
                        {deployments.map(dep => (
                           <div key={dep.id} className="p-4 bg-navy-panel/50 hover:bg-neutral-800/80 transition-colors rounded-xl border border-white/5 border-l-4 border-l-blue-500 group cursor-pointer">
                              <div className="flex justify-between items-start mb-2">
                                 <p className="text-sm font-bold text-white">{dep.volunteer}</p>
                                 <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${dep.status === 'transit' ? 'bg-sapphire/10 text-powder' : 'bg-amber-500/10 text-amber-300'}`}>
                                    {dep.eta}
                                 </span>
                              </div>
                              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-3">
                                 {dep.origin} <span className="text-neutral-600 mx-1">→</span> {dep.destination}
                              </p>
                              <div className="flex justify-between items-center">
                                 <p className="text-[10px] text-powder font-medium">{dep.cargo}</p>
                                 <p className="text-[10px] font-mono text-neutral-500">{dep.progress}%</p>
                              </div>
                              {/* Mini progress bar */}
                              <div className="h-1 w-full bg-neutral-800 rounded-full mt-2 overflow-hidden">
                                 <div className={`h-full ${dep.status === 'transit' ? 'bg-sapphire' : 'bg-amber-400'}`} style={{ width: `${dep.progress}%` }}></div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

               </div>
         </div>
      </DashboardLayout>
   );
}

function ProgressBar({ label, percentage }: { label: string, percentage: number }) {
   const isCritical = percentage < 20;

   return (
      <div>
         <div className="flex justify-between items-center mb-1">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isCritical ? 'text-red-500' : 'text-neutral-400'}`}>
               {label}
            </span>
            <span className={`text-[10px] font-mono ${isCritical ? 'text-red-500 animate-pulse' : 'text-neutral-500'}`}>
               {percentage}%
            </span>
         </div>
         <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden flex">
            <motion.div
               initial={{ width: 0 }}
               animate={{ width: `${percentage}%` }}
               transition={{ duration: 1, ease: "easeOut" }}
               className={`h-full ${isCritical ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-white/50'}`}
            />
         </div>
         {isCritical && (
            <p className="text-[8px] text-red-500 mt-1 uppercase tracking-widest font-bold flex items-center">
               <AlertTriangle className="w-3 h-3 mr-1" />
               Critical Shortage Alert
            </p>
         )}
      </div>
   );
}
