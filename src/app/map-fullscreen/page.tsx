'use client';

import { useState, useEffect } from 'react';
import { StrategicGlobe } from '@/components/Globe/StrategicGlobe';
import { ReliefMap } from '@/components/Map/ReliefMap';
import { LiveTelemetryStream } from '@/components/UI/LiveTelemetryStream';
import { DonationTracker } from '@/components/UI/DonationTracker';
import {
  Maximize2,
  Minimize2,
  Activity,
  Zap,
  X,
  Globe2,
  MapPin,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StandaloneMapFullscreen() {
  const [viewMode, setViewMode] = useState<'map' | 'globe'>('map');
  const [selectedCoords, setSelectedCoords] = useState<[number, number]>([26.1388, 91.6625]);
  const [showLeftHud, setShowLeftHud] = useState(true);
  const [showRightHud, setShowRightHud] = useState(true);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);

  // Keyboard shortcut listener (ESC to exit native fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleNativeFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsNativeFullscreen(true);
      }).catch(err => {
        console.warn("Native fullscreen request error:", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsNativeFullscreen(false);
      }).catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black overflow-hidden relative select-none z-[99999]">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-[2000] flex items-center justify-between pointer-events-auto gap-2 flex-wrap">
        <div className="flex items-center space-x-3 bg-neutral-900/95 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-white/10 shadow-2xl">
          <button
            onClick={() => window.close()}
            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold mr-2 cursor-pointer"
            title="Close Tab"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
            <span className="hidden sm:inline">Close</span>
          </button>

          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <h1 className="text-xs font-black text-white uppercase tracking-widest hidden sm:inline">
            IDCS FULLSCREEN GEOSPATIAL COMMAND
          </h1>
          <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded border border-indigo-500/30">
            {viewMode === 'globe' ? '3D ORBITAL LOCK' : '2D GEOSPATIAL MESH'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Mode Switcher */}
          <button
            onClick={() => setViewMode(viewMode === 'map' ? 'globe' : 'map')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-2xl border border-indigo-400/40 transition-all backdrop-blur-md shadow-xl flex items-center gap-2 cursor-pointer"
          >
            {viewMode === 'map' ? <Globe2 className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
            <span>{viewMode === 'map' ? 'Switch to 3D Globe' : 'Switch to 2D Map'}</span>
          </button>

          {/* Toggle HUD Left */}
          <button
            onClick={() => setShowLeftHud(!showLeftHud)}
            className={`px-3.5 py-2 text-[10px] font-black uppercase tracking-wider rounded-2xl border transition-all backdrop-blur-md shadow-xl cursor-pointer ${
              showLeftHud ? 'bg-indigo-600/90 text-white border-indigo-400' : 'bg-neutral-900/90 text-neutral-400 border-white/10 hover:text-white'
            }`}
          >
            {showLeftHud ? 'Hide Telemetry' : 'Show Telemetry'}
          </button>

          {/* Toggle HUD Right */}
          <button
            onClick={() => setShowRightHud(!showRightHud)}
            className={`px-3.5 py-2 text-[10px] font-black uppercase tracking-wider rounded-2xl border transition-all backdrop-blur-md shadow-xl cursor-pointer ${
              showRightHud ? 'bg-indigo-600/90 text-white border-indigo-400' : 'bg-neutral-900/90 text-neutral-400 border-white/10 hover:text-white'
            }`}
          >
            {showRightHud ? 'Hide Needs Panel' : 'Show Needs Panel'}
          </button>

          {/* Browser Native Fullscreen Button */}
          <button
            onClick={toggleNativeFullscreen}
            className="p-2.5 bg-neutral-900/90 hover:bg-white hover:text-black border border-white/20 text-white rounded-2xl transition-all shadow-xl flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-3.5 cursor-pointer"
            title="Toggle Native Monitor Fullscreen"
          >
            {isNativeFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isNativeFullscreen ? 'Exit Native' : 'Native Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* Floating Left Telemetry HUD */}
      <AnimatePresence>
        {showLeftHud && (
          <motion.div
            initial={{ x: -60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -60, opacity: 0 }}
            className="absolute top-20 left-4 z-[1500] w-80 bg-neutral-950/95 backdrop-blur-xl border border-neutral-800 rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.9)] text-white space-y-3"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                Live Telemetry Stream
              </span>
              <button onClick={() => setShowLeftHud(false)} className="text-neutral-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <LiveTelemetryStream />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Right Needs Panel */}
      <AnimatePresence>
        {showRightHud && (
          <motion.div
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 60, opacity: 0 }}
            className="absolute top-20 right-4 z-[1500] w-84 bg-neutral-950/95 backdrop-blur-xl border border-neutral-800 rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.9)] text-white space-y-3 max-h-[calc(100vh-7rem)] overflow-y-auto custom-scrollbar"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                Live Shipment & Needs
              </span>
              <button onClick={() => setShowRightHud(false)} className="text-neutral-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <DonationTracker trackingId="#DR-8832" itemName="Medical First Aid Kits" quantity={50} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pure 100% Viewport Canvas */}
      <div className="absolute inset-0 w-full h-full z-0">
        {viewMode === 'globe' ? (
          <StrategicGlobe onEngage={(coords) => {
            if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number') {
              setSelectedCoords([coords.lat, coords.lng]);
            }
            setViewMode('map');
          }} />
        ) : (
          <ReliefMap centerCoords={selectedCoords} rawContainer />
        )}
      </div>
    </div>
  );
}
