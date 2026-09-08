'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Globe from 'react-globe.gl';
import { useAppStore } from '@/store/useAppStore';
import * as THREE from 'three';
import { AlertTriangle, ShieldCheck, Compass, X, Radio, ArrowUpRight, Flame, Globe2, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchAllLiveDisasters, fetchIndiaDisasterEvents, LiveDisasterEvent, fetchLiveTelemetry, LiveTelemetryData, fetchOpenMeteoFlood, LiveFloodData, fetchLocationNews, NewsArticle } from '@/lib/disasterApi';
import { CloudRain, Thermometer, Wind, Waves, Newspaper } from 'lucide-react';

// Fast Haversine for distance calculation in KM
const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function GlobeClient({ onEngage }: { onEngage?: (coords?: { lat: number; lng: number }) => void }) {
  const globeRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);
  const incidentReports = useAppStore(state => state.incidentReports);
  const camps = useAppStore(state => state.camps);

  const [liveEvents, setLiveEvents] = useState<LiveDisasterEvent[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<{ lat: number; lng: number } | null>({
    lat: 26.1388,
    lng: 91.6625
  });
  const [pointWeather, setPointWeather] = useState<LiveTelemetryData | null>(null);
  const [pointFlood, setPointFlood] = useState<LiveFloodData | null>(null);
  const [pointNews, setPointNews] = useState<NewsArticle[]>([]);

  // Fetch Open-Meteo Weather, Flood & GDELT News API for selected coordinates
  useEffect(() => {
    if (!selectedPoint) return;
    let isMounted = true;

    async function loadPointTelemetry() {
      if (!selectedPoint) return;
      const [weather, flood, news] = await Promise.allSettled([
        fetchLiveTelemetry(selectedPoint.lat, selectedPoint.lng),
        fetchOpenMeteoFlood(selectedPoint.lat, selectedPoint.lng),
        fetchLocationNews('', selectedPoint.lat, selectedPoint.lng)
      ]);

      if (isMounted) {
        if (weather.status === 'fulfilled') setPointWeather(weather.value);
        if (flood.status === 'fulfilled') setPointFlood(flood.value);
        if (news.status === 'fulfilled') setPointNews(news.value || []);
      }
    }

    loadPointTelemetry();

    return () => {
      isMounted = false;
    };
  }, [selectedPoint]);

  // Fetch Live Public APIs (NASA EONET, USGS, GDACS, NDMA India) with local dataset fallback
  useEffect(() => {
    let isMounted = true;

    async function loadDisasters() {
      try {
        const [liveData, indiaData] = await Promise.all([
          fetchAllLiveDisasters(),
          fetchIndiaDisasterEvents()
        ]);
        if (isMounted) {
          const merged = [...indiaData, ...liveData];
          if (merged.length > 0) {
            setLiveEvents(merged);
            return;
          }
        }
      } catch (err) {
        console.error("Live disaster APIs failed, switching to local dataset fallback", err);
      }

      // Local Fallback if offline/network blocked
      fetch('/datasets/parsed_disasters.json')
        .then(res => res.json())
        .then(data => {
          if (isMounted && Array.isArray(data)) {
            const fallbackEvents: LiveDisasterEvent[] = data.slice(0, 40).map((r: any, idx: number) => ({
              id: `fallback-${idx}`,
              title: r.disaster_type || r.title || 'Disaster Event',
              description: r.location || 'Reported Region',
              category: 'General',
              lat: r.lat,
              lng: r.lng,
              timestamp: new Date().toISOString(),
              source: 'LOCAL'
            }));
            setLiveEvents(fallbackEvents);
          }
        })
        .catch(console.error);
    }

    loadDisasters();

    return () => {
      isMounted = false;
    };
  }, []);

  // Initial Orbit Fly-To & Scene Cleanup
  useEffect(() => {
    if (globeRef.current) {
      const controls = globeRef.current.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.6;
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      globeRef.current.pointOfView({ lat: 26.1388, lng: 91.6625, altitude: 2.0 }, 2000);
    }
  }, []);

  // Handle Dynamic Click on Any Location on Earth
  const handleGlobeClick = useCallback((coords: { lat: number; lng: number }) => {
    if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') return;

    setSelectedPoint({ lat: coords.lat, lng: coords.lng });

    if (globeRef.current) {
      globeRef.current.controls().autoRotate = false;
      globeRef.current.pointOfView(
        {
          lat: coords.lat,
          lng: coords.lng,
          altitude: 0.5
        },
        1800
      );
    }
  }, []);

  // Fast pre-filtered spatial search for nearby incidents (<500km)
  const nearbyIncidents = useMemo(() => {
    if (!selectedPoint) return [];

    const { lat, lng } = selectedPoint;

    // Quick bounding-box filter before exact Haversine calculation
    const allIncidents = [
      ...incidentReports.map(r => ({
        id: r.id,
        title: r.type || 'Emergency Incident',
        description: r.description,
        category: 'General',
        lat: r.location.lat,
        lng: r.location.lng,
        severity: (r as any).severity || (r.intensity > 0.7 ? 'Critical' : 'High'),
        source: 'LOCAL',
        dist: Math.abs(r.location.lat - lat) < 15 && Math.abs(r.location.lng - lng) < 15
          ? calculateDistanceKm(lat, lng, r.location.lat, r.location.lng)
          : 9999
      })),
      ...liveEvents.map((r, idx) => ({
        id: r.id || `live-${idx}`,
        title: r.title,
        description: r.description,
        category: r.category,
        lat: r.lat,
        lng: r.lng,
        severity: 'Critical',
        source: r.source,
        dist: Math.abs(r.lat - lat) < 15 && Math.abs(r.lng - lng) < 15
          ? calculateDistanceKm(lat, lng, r.lat, r.lng)
          : 9999
      }))
    ];

    return allIncidents
      .filter(item => item.dist <= 1500)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 5);
  }, [selectedPoint, incidentReports, liveEvents]);

  // Combine points for merged WebGL rendering
  const globePoints = useMemo(() => {
    const points = [
      ...incidentReports.map(r => ({
        lat: r.location.lat,
        lng: r.location.lng,
        size: 0.6,
        color: '#ef4444'
      })),
      ...camps.map(c => ({
        lat: c.location.lat,
        lng: c.location.lng,
        size: 0.8,
        color: '#3b82f6'
      })),
      ...liveEvents.map(r => ({
        lat: r.lat,
        lng: r.lng,
        size: r.source === 'USGS' ? 0.5 : r.source === 'NASA_EONET' ? 0.7 : 0.4,
        color: r.category === 'Earthquake' ? '#ef4444' : r.category === 'Wildfire' ? '#f97316' : '#3b82f6'
      }))
    ];

    if (selectedPoint) {
      points.push({
        lat: selectedPoint.lat,
        lng: selectedPoint.lng,
        size: 1.0,
        color: '#6366f1'
      });
    }

    return points;
  }, [incidentReports, camps, liveEvents, selectedPoint]);

  // Ring markers
  const ringsData = useMemo(() => {
    const rings: any[] = [];
    if (selectedPoint) {
      rings.push({
        lat: selectedPoint.lat,
        lng: selectedPoint.lng,
        color: '#6366f1'
      });
    }
    incidentReports.slice(0, 3).forEach(r => {
      rings.push({
        lat: r.location.lat,
        lng: r.location.lng,
        color: '#ef4444'
      });
    });
    return rings;
  }, [selectedPoint, incidentReports]);

  // Handle Cloud Mesh and RAF cleanup
  const handleGlobeReady = useCallback(() => {
    if (!globeRef.current) return;

    const cloudGeometry = new THREE.SphereGeometry(100 * 1.005, 48, 48); // Optimized segment count
    const cloudTexture = new THREE.TextureLoader().load('//unpkg.com/three-globe/example/img/earth-clouds.png');
    const cloudMaterial = new THREE.MeshPhongMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.35
    });

    const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    globeRef.current.scene().add(cloudMesh);

    const rotateClouds = () => {
      cloudMesh.rotation.y += 0.0003;
      animFrameRef.current = requestAnimationFrame(rotateClouds);
    };

    rotateClouds();
  }, []);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full cursor-pointer group flex items-center justify-center overflow-hidden bg-black">
      <Globe
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        onGlobeReady={handleGlobeReady}
        // Live Data Layers - WebGL Optimized
        pointsData={globePoints}
        pointColor={d => (d as any).color}
        pointAltitude={d => ((d as any).color === '#6366f1' ? 0.08 : 0.04)}
        pointRadius={d => (d as any).size}
        pointResolution={12}
        pointsMerge={true}
        ringsData={ringsData}
        ringColor={(d: any) => (d as any).color}
        ringMaxRadius={6}
        ringPropagationSpeed={3.5}
        ringRepeatPeriod={800}
        atmosphereColor="#93c5fd"
        atmosphereAltitude={0.2}
        rendererConfig={{ powerPreference: 'high-performance', antialias: true }}
        onGlobeClick={(coords) => handleGlobeClick(coords as { lat: number; lng: number })}
      />

      {/* Dynamic Location Info Popup */}
      <AnimatePresence>
        {selectedPoint && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="absolute top-6 right-6 z-30 w-80 bg-black/85 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-5 shadow-[0_10px_40px_rgba(0,0,0,0.8)] text-white"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/40">
                  <Compass className="w-4 h-4 text-indigo-400 animate-spin-slow" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-powder">Global Position HUD</h3>
                  <p className="text-[9px] text-neutral-400 font-mono">Live Satellite Lock</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPoint(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Coordinates Display */}
            <div className="grid grid-cols-2 gap-2 mb-3 bg-white/5 p-3 rounded-xl border border-white/5">
              <div>
                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block">Latitude</span>
                <span className="text-sm font-mono font-black text-indigo-300">
                  {selectedPoint.lat >= 0 ? `${selectedPoint.lat.toFixed(4)}° N` : `${Math.abs(selectedPoint.lat).toFixed(4)}° S`}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block">Longitude</span>
                <span className="text-sm font-mono font-black text-indigo-300">
                  {selectedPoint.lng >= 0 ? `${selectedPoint.lng.toFixed(4)}° E` : `${Math.abs(selectedPoint.lng).toFixed(4)}° W`}
                </span>
              </div>
            </div>

            {/* Live Open-Meteo Weather & Flood Telemetry */}
            {pointWeather && (
              <div className="mb-4 bg-gradient-to-r from-indigo-950/40 to-slate-900/60 p-3 rounded-xl border border-cyan-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                    <CloudRain className="w-3 h-3 text-cyan-400" />
                    Open-Meteo Live Climate
                  </span>
                  <span className="text-[8px] font-mono text-neutral-400">Real-Time</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="bg-black/40 p-1.5 rounded-lg border border-white/5">
                    <p className="text-[8px] text-neutral-400">Temp</p>
                    <p className="text-xs font-bold text-amber-300">{pointWeather.temperature}°C</p>
                  </div>
                  <div className="bg-black/40 p-1.5 rounded-lg border border-white/5">
                    <p className="text-[8px] text-neutral-400">Rain</p>
                    <p className="text-xs font-bold text-cyan-300">{pointWeather.rain} mm</p>
                  </div>
                  <div className="bg-black/40 p-1.5 rounded-lg border border-white/5">
                    <p className="text-[8px] text-neutral-400">Wind</p>
                    <p className="text-xs font-bold text-indigo-300">{pointWeather.windSpeed} k/h</p>
                  </div>
                </div>
                {pointFlood && pointFlood.riverDischarge > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[9px]">
                    <span className="text-neutral-400 flex items-center gap-1">
                      <Waves className="w-3 h-3 text-blue-400" /> River Discharge:
                    </span>
                    <span className="font-mono font-bold text-blue-300">{pointFlood.riverDischarge} m³/s</span>
                  </div>
                )}
              </div>
            )}

            {/* Incident Detection Status */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                  Nearby Incidents (&lt;500km)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[9px] font-black">
                  {nearbyIncidents.length} Found
                </span>
              </div>

              {nearbyIncidents.length > 0 ? (
                <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                  {nearbyIncidents.map(inc => (
                    <div key={inc.id} className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
                          <p className="text-xs font-bold text-red-200 line-clamp-1">{inc.title}</p>
                        </div>
                        <p className="text-[9px] text-neutral-400 mt-0.5">{inc.description}</p>
                      </div>
                      <span className="text-[9px] font-mono text-red-400 whitespace-nowrap ml-2">
                        {Math.round(inc.dist)} km
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center space-x-2 text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <p className="text-[10px] font-bold">No active disaster incidents detected within 500km radius.</p>
                </div>
              )}
            </div>

            {/* Real GDELT & UN GDACS Live Location News Headlines */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                  <Newspaper className="w-3.5 h-3.5 text-amber-400" />
                  Live GDELT News Headlines
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-mono font-bold">
                  {pointNews.length} Reports
                </span>
              </div>

              {pointNews.length > 0 ? (
                <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                  {pointNews.map((news, idx) => (
                    <a
                      key={idx}
                      href={news.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors group"
                    >
                      <p className="text-[11px] font-bold text-white group-hover:text-amber-300 line-clamp-2 leading-snug">
                        {news.title}
                      </p>
                      <div className="flex items-center justify-between mt-1 text-[8.5px] font-mono text-neutral-400">
                        <span className="text-amber-400 font-semibold">{news.source}</span>
                        <span>{news.seendate}</span>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="p-2.5 bg-white/5 rounded-xl text-[9.5px] text-neutral-400 italic text-center">
                  Fetching live regional disaster news...
                </div>
              )}
            </div>

            {/* Quick Action Button */}
            {onEngage && (
              <button
                onClick={() => onEngage(selectedPoint || { lat: 26.1388, lng: 91.6625 })}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all"
              >
                <span>Engage Tactical GIS Map</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .scene-container canvas {
          filter: contrast(1.1) brightness(1.1);
        }
      `}</style>
    </div>
  );
}


