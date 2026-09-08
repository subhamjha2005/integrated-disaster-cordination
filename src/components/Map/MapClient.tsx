'use client';

import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { useAppStore } from '@/store/useAppStore';
import { Crosshair, MapPin, Loader2, Layers, Zap, Navigation, ArrowRight, Radio, Battery, Cable, Wifi, RotateCcw, GripHorizontal, ChevronDown, ChevronUp, Activity, Sparkles, Newspaper, CloudRain, Thermometer, Wind, Waves, X } from 'lucide-react';
import { DroneRelay, EMERGENCY_HUBS } from './DroneRelay';
import { fetchNearbyEmergencyFacilities, EmergencyFacility, fetchLiveTelemetry, LiveTelemetryData, fetchOpenMeteoFlood, LiveFloodData, fetchLocationNews, NewsArticle } from '@/lib/disasterApi';
import { motion } from 'framer-motion';

// Custom Emergency Icons for OpenStreetMap Facilities
const createFacilityIcon = (color: string, label: string) => L.divIcon({
  className: 'custom-facility-marker',
  html: `<div style="background-color: ${color}; border: 2px solid white; color: white; font-weight: 900; font-size: 10px; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px ${color};">${label}</div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13]
});

const HospitalIcon = createFacilityIcon('#ef4444', 'H');
const ShelterIcon = createFacilityIcon('#10b981', 'S');
const FireIcon = createFacilityIcon('#f59e0b', 'F');
const PoliceIcon = createFacilityIcon('#6366f1', 'P');
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom User Pulse Icon
const UserIcon = L.divIcon({
  className: 'user-location-marker',
  html: '<div class="user-pulse"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

// Custom Heatmap Layer Component
function HeatLayer() {
  const map = useMap();
  const incidentReports = useAppStore(state => state.incidentReports);
  const [realMissions, setRealMissions] = useState<any[]>([]);

  // Disabling heavy dataset fetch to optimize load time
  // useEffect(() => {
  //   fetch('/datasets/parsed_disasters.json')
  //     .then(res => res.json())
  //     .then(data => setRealMissions(data))
  //     .catch(console.error);
  // }, []);

  useEffect(() => {
    if (!incidentReports.length && !realMissions.length) return;

    const heatPoints = [
      ...incidentReports.map(r => [
        r.location.lat,
        r.location.lng,
        r.intensity * 2.0
      ]),
      ...realMissions.map((r: any) => [
        r.lat,
        r.lng,
        0.5
      ])
    ] as [number, number, number][];

    const heatLayer = (L as any).heatLayer(heatPoints, {
      radius: 35,
      blur: 20,
      maxZoom: 17,
      gradient: { 0.4: 'cyan', 0.65: 'lime', 1: 'red' }
    });

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [incidentReports, realMissions, map]);

  return null;
}

// Auto-center map to bounds of all camps
function MapBounds() {
  const camps = useAppStore(state => state.camps);
  const map = useMap();

  useEffect(() => {
    if (camps.length > 0) {
      const bounds = L.latLngBounds(camps.map(c => [c.location.lat, c.location.lng]));
      map.fitBounds(bounds, { padding: [100, 100], maxZoom: 15 });
    }
  }, [camps, map]);

  return null;
}

// Auto-invalidate size when container toggles or window resizes
function MapResizeObserver() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;

    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });

    observer.observe(container);
    map.invalidateSize();

    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 300);
    const t3 = setTimeout(() => map.invalidateSize(), 800);

    return () => {
      observer.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [map]);

  return null;
}

// User Location Controller
function UserLocationController({ userLocation }: {
  userLocation: [number, number] | null
}) {
  const map = useMap();

  useEffect(() => {
    if (userLocation) {
      map.flyTo(userLocation, 16, { duration: 2 });
    }
  }, [userLocation, map]);

  return null;
}

// Target Location Controller
function TargetCenterController({ centerCoords }: { centerCoords?: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    if (centerCoords && centerCoords[0] && centerCoords[1]) {
      map.flyTo(centerCoords, 13, { duration: 1.8 });
    }
  }, [centerCoords, map]);

  return null;
}

// Map Click Event Listener for Location News & Telemetry
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export default function MapClient({ centerCoords }: { centerCoords?: [number, number] }) {
  const camps = useAppStore(state => state.camps);
  const {
    isDroneDeployed,
    deployDrone,
    recallDrone,
    rfMode,
    setRfMode,
    dronePowerMode,
    setDronePowerMode,
    originHubId,
    destHubId,
    setMeshRoute,
    priorityMessages
  } = useAppStore();

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [facilities, setFacilities] = useState<EmergencyFacility[]>([]);
  const [isTelemetryCollapsed, setIsTelemetryCollapsed] = useState(false);

  const [clickedPoint, setClickedPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [pointTelemetry, setPointTelemetry] = useState<LiveTelemetryData | null>(null);
  const [pointFlood, setPointFlood] = useState<LiveFloodData | null>(null);
  const [pointNews, setPointNews] = useState<NewsArticle[]>([]);

  useEffect(() => {
    if (!clickedPoint) return;
    let isMounted = true;
    async function loadClickData() {
      if (!clickedPoint) return;
      const [telemetry, flood, news] = await Promise.allSettled([
        fetchLiveTelemetry(clickedPoint.lat, clickedPoint.lng),
        fetchOpenMeteoFlood(clickedPoint.lat, clickedPoint.lng),
        fetchLocationNews('', clickedPoint.lat, clickedPoint.lng)
      ]);
      if (isMounted) {
        if (telemetry.status === 'fulfilled') setPointTelemetry(telemetry.value);
        if (flood.status === 'fulfilled') setPointFlood(flood.value);
        if (news.status === 'fulfilled') setPointNews(news.value || []);
      }
    }
    loadClickData();
    return () => { isMounted = false; };
  }, [clickedPoint]);

  const hubA = EMERGENCY_HUBS.find(h => h.id === originHubId) || EMERGENCY_HUBS[0];
  const hubB = EMERGENCY_HUBS.find(h => h.id === destHubId) || EMERGENCY_HUBS[3];

  const handleDeployOrRefly = () => {
    if (isDroneDeployed) {
      recallDrone();
      setTimeout(() => {
        deployDrone();
      }, 150);
    } else {
      deployDrone();
    }
  };

  const initialCenter: [number, number] = centerCoords || [26.1388, 91.6625];

  // Fetch Real OpenStreetMap Emergency Facilities (Hospitals, Shelters, Fire/Police)
  useEffect(() => {
    let isMounted = true;
    const targetLat = centerCoords ? centerCoords[0] : 26.1388;
    const targetLng = centerCoords ? centerCoords[1] : 91.6625;

    fetchNearbyEmergencyFacilities(targetLat, targetLng, 15)
      .then(data => {
        if (isMounted) setFacilities(data);
      })
      .catch(err => {
        console.warn('Facilities loading notice:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [centerCoords]);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setIsLocating(false);
      },
      (error) => {
        console.error("Error detecting location:", error);
        alert("Unable to retrieve your location. Please check permissions.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="w-full h-full relative group">
      {/* Cinematic HUD Elements Wrapper */}
      <div className="absolute inset-0 z-10 pointer-events-none border-[1px] border-white/5 rounded-xl overflow-hidden">
        <div className="scanline"></div>
      </div>

      {/* Repositioned Locate Me Button (Bottom Right) */}
      <div className="absolute bottom-16 right-6 z-[1001] flex flex-col space-y-2">
        <button
          onClick={handleLocate}
          disabled={isLocating}
          className="p-4 bg-indigo-600/90 backdrop-blur-md neo-btn text-white rounded-2xl hover:text-powder flex items-center justify-center group/btn"
          title="Locate Me"
        >
          {isLocating ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Crosshair className="w-6 h-6 group-hover/btn:rotate-90 transition-transform duration-500" />
          )}
          <div className="absolute right-full mr-3 px-3 py-1 bg-black/80 rounded-lg text-[10px] font-black uppercase tracking-widest opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap border border-white/10 pointer-events-none">
            Locate Position
          </div>
        </button>
      </div>

      <MapContainer
        center={initialCenter}
        zoom={13}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        className="rounded-xl overflow-hidden shadow-2xl grayscale-[0.1] contrast-[1.1]"
        scrollWheelZoom={true}
      >
        <LayersControl position="bottomleft">
          <LayersControl.BaseLayer checked name="Tactical Dark">
            <TileLayer
              attribution='&copy; Esri World Dark Gray Canvas'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite View">
            <TileLayer
              attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Street Map">
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <HeatLayer />
        <MapBounds />
        <MapResizeObserver />
        <MapClickHandler onMapClick={(lat, lng) => setClickedPoint({ lat, lng })} />
        <UserLocationController userLocation={userLocation} />
        <TargetCenterController centerCoords={centerCoords} />

        {clickedPoint && (
          <Marker position={[clickedPoint.lat, clickedPoint.lng]}>
            <Popup className="custom-popup" position={[clickedPoint.lat, clickedPoint.lng]}>
              <div className="p-2 min-w-[230px] max-w-[300px]">
                <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
                  <h4 className="font-black text-xs text-indigo-300 flex items-center gap-1 uppercase">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" /> Clicked Location GIS
                  </h4>
                  <span className="text-[9px] font-mono text-neutral-400">
                    {clickedPoint.lat.toFixed(3)}°, {clickedPoint.lng.toFixed(3)}°
                  </span>
                </div>

                {pointTelemetry && (
                  <div className="mb-2 bg-white/5 p-2 rounded-lg text-[9px] grid grid-cols-3 gap-1 text-center font-mono">
                    <div>
                      <span className="text-neutral-400 block">Temp</span>
                      <span className="text-amber-300 font-bold">{pointTelemetry.temperature}°C</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block">Rain</span>
                      <span className="text-cyan-300 font-bold">{pointTelemetry.rain}mm</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block">Wind</span>
                      <span className="text-indigo-300 font-bold">{pointTelemetry.windSpeed}k/h</span>
                    </div>
                  </div>
                )}

                {pointFlood && pointFlood.riverDischarge > 0 && (
                  <div className="mb-2 text-[9px] font-mono bg-blue-500/10 p-1.5 rounded flex justify-between">
                    <span className="text-neutral-400">River Discharge:</span>
                    <span className="text-blue-300 font-bold">{pointFlood.riverDischarge} m³/s</span>
                  </div>
                )}

                <div className="mt-2">
                  <p className="text-[9px] font-black uppercase text-amber-400 mb-1 flex items-center gap-1">
                    <Newspaper className="w-3 h-3 text-amber-400" /> GDELT Live Location News
                  </p>
                  {pointNews.length > 0 ? (
                    <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                      {pointNews.map((n, idx) => (
                        <a
                          key={idx}
                          href={n.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-[9.5px] font-medium text-white hover:text-amber-300 line-clamp-2 leading-tight bg-white/5 p-1.5 rounded transition-colors"
                        >
                          • {n.title}
                          <span className="block text-[8px] text-neutral-400 mt-0.5">{n.source} • {n.seendate}</span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[8.5px] text-neutral-400 italic">Fetching GDELT live news...</p>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {userLocation && (
          <Marker position={userLocation} icon={UserIcon}>
            <Popup className="custom-popup">
              <div className="p-2 text-center">
                <p className="text-[10px] font-black text-powder uppercase tracking-widest mb-1">Your Live Location</p>
                <p className="text-xs font-mono text-white">
                  {userLocation[0].toFixed(4)}°N, {userLocation[1].toFixed(4)}°E
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {camps.map(camp => (
          <Marker key={camp.id} position={[camp.location.lat, camp.location.lng]}>
            <Popup className="custom-popup">
              <div className="p-1 min-w-[150px]">
                <h3 className="font-bold text-base text-white border-b border-white/10 pb-1 mb-2">{camp.name}</h3>
                <div className="space-y-1.5">
                  <p className="text-xs flex justify-between">
                    <span className="text-neutral-400">Status:</span>
                    <span className={camp.status === 'Over Capacity' ? 'text-red-400 font-black' : 'text-powder font-black'}>{camp.status}</span>
                  </p>
                  <p className="text-xs flex justify-between">
                    <span className="text-neutral-400">Capacity:</span>
                    <span className="text-white font-mono">{Math.round((camp.currentOccupancy / camp.capacity) * 100)}%</span>
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Real OpenStreetMap Emergency Facilities */}
        {facilities.map(fac => {
          const icon = fac.type === 'Hospital' ? HospitalIcon : fac.type === 'Shelter' ? ShelterIcon : fac.type === 'Fire Station' ? FireIcon : PoliceIcon;
          return (
            <Marker key={fac.id} position={[fac.lat, fac.lng]} icon={icon}>
              <Popup className="custom-popup">
                <div className="p-1.5 min-w-[180px]">
                  <div className="flex items-center space-x-2 border-b border-white/10 pb-1 mb-1.5">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black text-white uppercase ${fac.type === 'Hospital' ? 'bg-red-500' : fac.type === 'Shelter' ? 'bg-emerald-500' : fac.type === 'Fire Station' ? 'bg-amber-500' : 'bg-indigo-500'}`}>
                      {fac.type}
                    </span>
                    <h4 className="font-bold text-xs text-white line-clamp-1">{fac.name}</h4>
                  </div>
                  <p className="text-[10px] text-neutral-400 font-mono">
                    {fac.lat.toFixed(4)}°N, {fac.lng.toFixed(4)}°E
                  </p>
                  {fac.address && (
                    <p className="text-[9px] text-neutral-300 mt-1 italic">{fac.address}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Static Points of Interest (HUBS) */}
        {EMERGENCY_HUBS.map(hub => {
          const HubIcon = L.divIcon({
            className: 'custom-hub-icon',
            html: `
              <div class="flex flex-col items-center justify-center -mt-6">
                <div class="px-2 py-0.5 rounded text-[8px] font-black uppercase whitespace-nowrap text-white border mb-1 bg-black/80 backdrop-blur-md shadow-lg" style="border-color: ${hub.color}; color: ${hub.color}">
                  ${hub.name}
                </div>
                <div class="w-3 h-3 rounded-full border-2 border-black" style="background-color: ${hub.color}; box-shadow: 0 0 10px ${hub.color}"></div>
              </div>
            `,
            iconSize: [12, 12],
            iconAnchor: [6, 12]
          });

          return (
            <Marker key={hub.id} position={hub.pos} icon={HubIcon}>
              <Popup className="custom-popup">
                <div className="p-1 min-w-[120px]">
                  <h3 className="font-bold text-base border-b border-white/10 pb-1 mb-2" style={{ color: hub.color }}>{hub.name}</h3>
                  <p className="text-xs text-neutral-400">IDCS Integrated Hub</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        <DroneRelay userLocation={userLocation || [26.1859, 91.7477]} />
      </MapContainer>

      {/* 1. Location A ↔ Location B Selector Card (Top Left) */}
      <div className="absolute top-4 left-4 z-[500] w-72 pointer-events-auto">
        <div className="bg-black/90 backdrop-blur-md border border-white/10 rounded-xl p-3.5 shadow-2xl space-y-2.5">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <div className="flex items-center space-x-2">
              <Navigation className="w-3.5 h-3.5 text-emerald-400" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Inter-Hub Mesh Swarm</h4>
            </div>
            <span className="text-[8px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
              4 Drones (2+2)
            </span>
          </div>

          <div className="space-y-1.5">
            <div>
              <label className="text-[8px] font-black uppercase tracking-wider text-emerald-400 mb-0.5 block flex items-center justify-between">
                <span>Location A (Origin)</span>
                <span className="text-[7px] text-neutral-400 font-mono">Dispatches 2 Drones</span>
              </label>
              <select
                value={originHubId}
                onChange={(e) => setMeshRoute(e.target.value, destHubId)}
                className="w-full bg-white/5 border border-white/10 text-white text-xs font-bold rounded-lg px-2 py-1.5 outline-none focus:border-emerald-500 cursor-pointer"
              >
                {EMERGENCY_HUBS.map(hub => (
                  <option key={hub.id} value={hub.id} className="bg-neutral-900 text-white">
                    {hub.name} ({hub.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-center">
              <ArrowRight className="w-3 h-3 text-neutral-500 rotate-90" />
            </div>

            <div>
              <label className="text-[8px] font-black uppercase tracking-wider text-amber-400 mb-0.5 block flex items-center justify-between">
                <span>Location B (Destination)</span>
                <span className="text-[7px] text-neutral-400 font-mono">Dispatches 2 Drones</span>
              </label>
              <select
                value={destHubId}
                onChange={(e) => setMeshRoute(originHubId, e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white text-xs font-bold rounded-lg px-2 py-1.5 outline-none focus:border-amber-500 cursor-pointer"
              >
                {EMERGENCY_HUBS.map(hub => (
                  <option key={hub.id} value={hub.id} disabled={hub.id === originHubId} className="bg-neutral-900 text-white">
                    {hub.name} ({hub.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleDeployOrRefly}
              className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.5)] flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              {isDroneDeployed ? (
                <>
                  <RotateCcw className="w-3 h-3 animate-spin" />
                  <span>Re-Fly 4 Drones</span>
                </>
              ) : (
                <>
                  <Zap className="w-3 h-3" />
                  <span>Launch 4 Drones</span>
                </>
              )}
            </button>

            {isDroneDeployed && (
              <button
                onClick={recallDrone}
                className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-bold uppercase rounded-lg transition-colors cursor-pointer"
              >
                Recall
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Tactical Telemetry HUD (Draggable, Resizable, Collapsible) */}
      {isDroneDeployed && (
        <motion.div
          drag
          dragMomentum={false}
          initial={{ x: 0, y: 0 }}
          className="absolute top-4 right-16 z-[500] pointer-events-auto"
          style={{ touchAction: 'none' }}
        >
          <div className="bg-black/92 backdrop-blur-xl border border-white/20 rounded-2xl p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-2.5 text-xs resize-both overflow-hidden min-w-[280px] max-w-[450px] min-h-[140px] max-h-[500px] flex flex-col justify-between">
            {/* Header / Drag Bar */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2 cursor-grab active:cursor-grabbing select-none">
              <div className="flex items-center space-x-2">
                <GripHorizontal className="w-3.5 h-3.5 text-neutral-500 hover:text-white transition-colors" />
                <div className="flex items-center space-x-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Tactical Telemetry</h4>
                </div>
              </div>
              
              <div className="flex items-center space-x-1.5">
                <span className="text-[8px] font-mono text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  LINK ACTIVE
                </span>
                <button
                  onClick={() => setIsTelemetryCollapsed(!isTelemetryCollapsed)}
                  className="p-1 hover:bg-white/10 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title={isTelemetryCollapsed ? "Expand Telemetry" : "Collapse Telemetry"}
                >
                  {isTelemetryCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Collapsible Body */}
            {!isTelemetryCollapsed && (
              <div className="flex-1 flex flex-col justify-between space-y-2 overflow-y-auto pr-0.5">
                {/* Metrics Matrix */}
                <div className="space-y-1.5 font-mono text-[10px] bg-white/5 p-2.5 rounded-xl border border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Swarm Vector:</span>
                    <span className="text-emerald-400 font-bold bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20">{hubA.id} ↔ {hubB.id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Swarm Formation:</span>
                    <span className="text-white font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      4 Relays (2 Loc A + 2 Loc B)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Signal RSSI / SNR:</span>
                    <span className="text-emerald-400 font-bold">{rfMode === 'lora' ? '-84 dBm (SNR: +9dB)' : '-76 dBm (SNR: +14dB)'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">DTN Transit Queue:</span>
                    <span className="text-amber-400 font-bold">{priorityMessages.filter(m => m.status !== 'delivered').length} packets</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Air Link Encryption:</span>
                    <span className="text-cyan-300 font-bold">AES-256-GCM OTA</span>
                  </div>
                </div>

                {/* Protocol & Power Selectors */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    onClick={() => setRfMode(rfMode === 'lora' ? 'cofdm' : 'lora')}
                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-mono text-left flex items-center justify-between transition-all hover:border-emerald-500/40 cursor-pointer"
                  >
                    <div>
                      <div className="text-neutral-400 text-[8px]">RF BAND</div>
                      <span className="text-white font-bold">{rfMode === 'lora' ? '915M LoRa' : '1.4G COFDM'}</span>
                    </div>
                    <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />
                  </button>

                  <button
                    onClick={() => setDronePowerMode(dronePowerMode === 'battery' ? 'tethered' : 'battery')}
                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-mono text-left flex items-center justify-between transition-all hover:border-cyan-500/40 cursor-pointer"
                  >
                    <div>
                      <div className="text-neutral-400 text-[8px]">POWER BUS</div>
                      <span className="text-white font-bold">{dronePowerMode === 'tethered' ? 'Tether 24h' : 'Battery Swarm'}</span>
                    </div>
                    {dronePowerMode === 'tethered' ? <Cable className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-1" /> : <Battery className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1" />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[8px] text-neutral-500 font-mono pt-1 border-t border-white/5">
                  <span>DRAG TO MOVE • PULL CORNER TO RESIZE</span>
                  <span className="text-neutral-400 flex items-center gap-1">
                    <Activity className="w-2.5 h-2.5 text-emerald-400" />
                    LIVE TELEMETRY
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Viewport HUD */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
        <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center space-x-3 shadow-2xl">
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-[8px] font-black text-white uppercase tracking-widest">Heat: Active</span>
          </div>
          <div className="w-[1px] h-3 bg-neutral-700"></div>
          {userLocation ? (
            <div className="flex items-center space-x-2">
              <MapPin className="w-2 h-2 text-powder animate-pulse" />
              <span className="text-[8px] font-black text-powder uppercase tracking-widest">
                GPS: {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Layers className="w-2 h-2 text-neutral-500" />
              <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-tighter italic">Multi-View Hub</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
