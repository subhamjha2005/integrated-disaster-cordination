'use client';

import { useEffect, useState, useRef } from 'react';
import { Marker, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAppStore } from '@/store/useAppStore';
import { getQueuedActions, clearActionQueue } from '@/lib/offlineSync';
import { Zap, Bluetooth, Phone, Send } from 'lucide-react';

export interface EmergencyHub {
  id: string;
  name: string;
  pos: [number, number];
  color: string;
}

export const EMERGENCY_HUBS: EmergencyHub[] = [
  { id: 'HQ', name: 'HQ Gateway', pos: [26.1158, 91.7582], color: '#10b981' }, // emerald
  { id: 'HOSP', name: 'City Hospital', pos: [26.1112, 91.7512], color: '#f43f5e' }, // rose
  { id: 'FIRE', name: 'Fire Brigade', pos: [26.1445, 91.7362], color: '#3b82f6' }, // blue
  { id: 'CAMP', name: 'Relief Camp Alpha', pos: [26.1859, 91.7477], color: '#f59e0b' }, // amber
  { id: 'POL', name: 'Police HQ', pos: [26.1350, 91.7700], color: '#8b5cf6' }, // violet
  { id: 'MED', name: 'Mobile Clinic', pos: [26.1600, 91.7200], color: '#ec4899' }, // pink
];

// Linear interpolation
const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

// Distance calculation
const getDistance = (p1: [number, number], p2: [number, number]) => {
  return Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
};

const DroneIcon = L.divIcon({
  className: 'custom-drone-icon',
  html: `
    <div class="w-6 h-6 bg-black border border-yellow-400 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(250,204,21,0.5)]">
      <div class="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

interface DroneState {
  id: string;
  originId: string;
  startPos: [number, number];
  targetPos: [number, number];
  currentPos: [number, number];
  speed: number;
  flightDurationMs: number;
}

interface DroneRelayProps {
  userLocation: [number, number];
}

const MAX_LINK_DISTANCE = 0.025; // Approx 2.5km max range between drones
const DRONES_PER_HUB = 4;
const WIFI_RADIUS_METERS = 1500; // Overlapping circles

export function DroneRelay({ userLocation }: DroneRelayProps) {
  const { isDroneDeployed, deliverQueuedMessages, hopQueuedMessages, syncOfflineActions } = useAppStore();
  
  const [drones, setDrones] = useState<DroneState[]>([]);
  const [meshLinks, setMeshLinks] = useState<[ [number, number], [number, number] ][]>([]);
  const [meshActive, setMeshActive] = useState(false);
  const [telemetry, setTelemetry] = useState({ eta: 100, activeNodes: 0 });
  
  const [targetHub, setTargetHub] = useState<EmergencyHub | null>(null);
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [reinforcing, setReinforcing] = useState(false);
  
  const [showCallMock, setShowCallMock] = useState(false);
  const [showBluetoothMock, setShowBluetoothMock] = useState(false);

  const animationRef = useRef<number | undefined>(undefined);
  const progressRef = useRef(0);
  const deliveredRef = useRef(false);
  const map = useMap();

  useEffect(() => {
    if (!isDroneDeployed) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      setDrones([]);
      setMeshLinks([]);
      setMeshActive(false);
      setTargetHub(null);
      setReinforcing(false);
      progressRef.current = 0;
      deliveredRef.current = false;
      return;
    }

    // 1. Find nearest Hub to User
    let nearest = EMERGENCY_HUBS[0];
    let minD = Infinity;
    EMERGENCY_HUBS.forEach(h => {
      const d = getDistance(h.pos, userLocation);
      if (d < minD) {
        minD = d;
        nearest = h;
      }
    });
    setTargetHub(nearest);

    // 2. Intelligent Routing Algorithm
    const distanceToHub = getDistance(userLocation, nearest.pos);
    const numWaypoints = Math.max(0, Math.ceil(distanceToHub / MAX_LINK_DISTANCE) - 1);
    
    let maxDuration = 0;
    const initialDrones: DroneState[] = [];
    const currentInventory: Record<string, number> = {};
    EMERGENCY_HUBS.forEach(h => currentInventory[h.id] = DRONES_PER_HUB);
    
    for (let i = 1; i <= numWaypoints; i++) {
      const factor = i / (numWaypoints + 1);
      const waypoint: [number, number] = [
        lerp(userLocation[0], nearest.pos[0], factor),
        lerp(userLocation[1], nearest.pos[1], factor)
      ];

      let selectedHub: EmergencyHub | null = null;
      let hubDist = Infinity;
      for (const hub of EMERGENCY_HUBS) {
        if (currentInventory[hub.id] > 0) {
          const d = getDistance(hub.pos, waypoint);
          if (d < hubDist) {
            hubDist = d;
            selectedHub = hub;
          }
        }
      }

      if (selectedHub) {
        currentInventory[selectedHub.id] -= 1;
        const speedKmh = Math.floor(Math.random() * 20) + 50; // 50-70 km/h
        
        // Physics calculations
        // 1 degree is approx 111 km
        const distKm = hubDist * 111; 
        const timeHours = distKm / speedKmh;
        const timeSeconds = timeHours * 3600;
        
        // Time Scaling for Demo (e.g. 1 hour = 60 seconds, 1 min = 1 sec -> 60x speed)
        // Let's scale it so a typical 3km flight (~3 mins) takes about 4 seconds.
        // 3 mins = 180s. 180s / 45 = 4s. So 45x speed multiplier.
        // Let's use a 40x speed multiplier.
        const demoDurationMs = Math.max(1500, (timeSeconds / 40) * 1000); 

        if (demoDurationMs > maxDuration) {
          maxDuration = demoDurationMs;
        }

        initialDrones.push({
          id: `DRN-${selectedHub.id}-${DRONES_PER_HUB - currentInventory[selectedHub.id]}`,
          originId: selectedHub.id,
          startPos: selectedHub.pos,
          targetPos: waypoint,
          currentPos: selectedHub.pos,
          speed: speedKmh,
          flightDurationMs: demoDurationMs
        });
      }
    }

    setInventory(currentInventory);
    setDrones(initialDrones);

    const bounds = L.latLngBounds([userLocation, nearest.pos, ...initialDrones.map(d => d.startPos)]);
    map.flyToBounds(bounds, { padding: [50, 50], duration: 2 });

    let startTime: number | null = null;
    const hasHoppedRef = { current: false };

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      
      let allArrived = true;

      setDrones(prev => {
        const updated = prev.map(d => {
          // Skip redundant aux drones (they have their own animation loop)
          if (d.id.includes('AUX')) return d;

          let progress = Math.min(elapsed / d.flightDurationMs, 1);
          if (progress < 1) allArrived = false;

          const easeProgress = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

          return {
            ...d,
            currentPos: [
              lerp(d.startPos[0], d.targetPos[0], easeProgress),
              lerp(d.startPos[1], d.targetPos[1], easeProgress)
            ] as [number, number]
          };
        });
        
        // Use maxDuration for the overall ETA countdown
        const overallProgress = Math.min(elapsed / maxDuration, 1);
        progressRef.current = overallProgress;
        setTelemetry({ 
          eta: Math.max(0, Math.ceil((maxDuration - elapsed) / 1000)), 
          activeNodes: updated.length 
        });
        
        return updated;
      });

      if (elapsed > 1000 && !hasHoppedRef.current) {
        hasHoppedRef.current = true;
        hopQueuedMessages();
      }

      if (!allArrived) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setMeshActive(true);
        if (!deliveredRef.current) {
          deliveredRef.current = true;
          deliverQueuedMessages();
          getQueuedActions().then(actions => {
            if (actions.length > 0) {
              syncOfflineActions(actions);
              clearActionQueue();
            }
          });
        }
      }
    };

    setTimeout(() => {
      animationRef.current = requestAnimationFrame(animate);
    }, 2000);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isDroneDeployed, map, userLocation, deliverQueuedMessages, hopQueuedMessages, syncOfflineActions]);

  // Update mesh links whenever drones settle or are added
  useEffect(() => {
    if (!meshActive || !targetHub) return;
    const links: [ [number, number], [number, number] ][] = [];
    const orderedNodes = [userLocation, ...drones.map(d => d.targetPos), targetHub.pos];
    for (let i = 0; i < orderedNodes.length - 1; i++) {
      links.push([orderedNodes[i], orderedNodes[i + 1]]);
    }
    setMeshLinks(links);
  }, [meshActive, drones, targetHub, userLocation]);

  const handleReinforce = () => {
    if (!targetHub || reinforcing) return;
    setReinforcing(true);

    // Find center point of the mesh
    const midPoint: [number, number] = [
      lerp(userLocation[0], targetHub.pos[0], 0.5),
      lerp(userLocation[1], targetHub.pos[1], 0.5)
    ];

    // Find closest hub with inventory > 1
    let backupHub: EmergencyHub | null = null;
    let hubDist = Infinity;
    for (const hub of EMERGENCY_HUBS) {
      if (inventory[hub.id] >= 2) {
        const d = getDistance(hub.pos, midPoint);
        if (d < hubDist) {
          hubDist = d;
          backupHub = hub;
        }
      }
    }

    if (backupHub) {
      const newDrones: DroneState[] = [
        {
          id: `DRN-${backupHub.id}-AUX1`,
          originId: backupHub.id,
          startPos: backupHub.pos,
          targetPos: [midPoint[0] + 0.005, midPoint[1]],
          currentPos: backupHub.pos,
          speed: 85,
          flightDurationMs: 4000 // Fixed fast reinforcement flight
        },
        {
          id: `DRN-${backupHub.id}-AUX2`,
          originId: backupHub.id,
          startPos: backupHub.pos,
          targetPos: [midPoint[0] - 0.005, midPoint[1]],
          currentPos: backupHub.pos,
          speed: 85,
          flightDurationMs: 4000
        }
      ];

      setInventory(prev => ({
        ...prev,
        [backupHub.id]: prev[backupHub.id] - 2
      }));

      // Start a separate animation for these two drones
      const duration = 4000;
      let start: number | null = null;
      const animateReinforce = (t: number) => {
        if (!start) start = t;
        const elapsed = t - start;
        const prog = Math.min(elapsed / duration, 1);
        const ease = prog < 0.5 ? 2 * prog * prog : -1 + (4 - 2 * prog) * prog;

        setDrones(prev => {
          const base = prev.filter(d => !d.id.includes('AUX'));
          const aux = newDrones.map(d => ({
            ...d,
            currentPos: [
              lerp(d.startPos[0], d.targetPos[0], ease),
              lerp(d.startPos[1], d.targetPos[1], ease)
            ] as [number, number]
          }));
          return [...base, ...aux];
        });

        if (prog < 1) {
          requestAnimationFrame(animateReinforce);
        } else {
          // Add cross-links to the redundant drones
          setMeshLinks(prev => [
            ...prev,
            [newDrones[0].targetPos, midPoint],
            [newDrones[1].targetPos, midPoint]
          ]);
        }
      };
      
      requestAnimationFrame(animateReinforce);
    }
  };

  if (!isDroneDeployed) return null;

  return (
    <>
      {/* Dynamic Mesh Links */}
      {meshActive && meshLinks.map((link, idx) => (
        <Polyline 
          key={idx} 
          positions={link} 
          pathOptions={{ color: '#10b981', weight: 4, opacity: 0.9 }} 
          className="animate-pulse"
        />
      ))}

      {/* Drones & Wi-Fi Ranges */}
      {drones.map(drone => (
        <div key={drone.id}>
          <Marker position={drone.currentPos} icon={DroneIcon} zIndexOffset={100} />
          {meshActive && (
            <Circle 
              center={drone.currentPos} 
              radius={WIFI_RADIUS_METERS} 
              pathOptions={{ 
                color: '#facc15', 
                fillColor: '#facc15', 
                fillOpacity: 0.1, 
                weight: 1, 
                dashArray: '4' 
              }} 
            />
          )}
        </div>
      ))}

      {/* Live Telemetry HUD Overlay */}
      <div className="absolute top-20 right-4 z-[1000] w-64 pointer-events-none">
        <div className="bg-black/90 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-2xl pointer-events-auto">
          <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Smart Mesh Routing</h4>
            <div className={`w-2 h-2 rounded-full ${meshActive ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-[10px]">
              <span className="text-neutral-500 font-bold uppercase">Nearest Hub</span>
              <span className="text-emerald-400 font-black uppercase">{targetHub?.name || 'Searching...'}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-neutral-500 font-bold uppercase">Status</span>
              <span className={meshActive ? "text-emerald-400 font-black uppercase" : "text-amber-400 font-black uppercase"}>
                {meshActive ? 'Mesh Locked' : 'Calculating Path...'}
              </span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-neutral-500 font-bold uppercase">Drones Deployed</span>
              <span className="text-white font-mono">{telemetry.activeNodes} / 24</span>
            </div>
            {!meshActive && (
              <div className="flex justify-between text-[10px]">
                <span className="text-neutral-500 font-bold uppercase">Est. T-Minus</span>
                <span className="text-white font-mono">{telemetry.eta}s</span>
              </div>
            )}
          </div>

          <div className="h-28 overflow-y-auto custom-scrollbar pr-1 space-y-1 mb-3">
            {drones.map(drone => (
              <div key={drone.id} className="flex justify-between items-center bg-white/5 px-2 py-1.5 rounded">
                <span className="text-[9px] font-mono text-neutral-300">{drone.id}</span>
                <span className="text-[9px] font-mono text-yellow-400">{drone.speed}km/h</span>
              </div>
            ))}
            {drones.length === 0 && (
              <div className="flex items-center justify-center h-full text-[9px] font-mono text-neutral-500 text-center px-4">
                Routing complete.<br/>No intermediate hops required.
              </div>
            )}
          </div>

          {meshActive && (
            <button 
              onClick={handleReinforce}
              disabled={reinforcing}
              className="w-full py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 rounded flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
            >
              <Zap className="w-3 h-3 text-yellow-400" />
              <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">
                {reinforcing ? 'Reinforcing...' : 'Add Drones'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Local Network Chat Interface (ESP32) */}
      {meshActive && (
        <div className="absolute bottom-6 right-6 z-[1000] w-80 pointer-events-none animate-in fade-in slide-in-from-bottom-10 duration-500">
          <div className="bg-black/90 backdrop-blur-md border border-emerald-500/30 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.15)] pointer-events-auto flex flex-col h-[24rem]">
            
            {/* Header */}
            <div className="bg-emerald-900/40 border-b border-emerald-500/30 p-3 flex items-center justify-between">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Local Mesh Comms
                </h4>
                <p className="text-[8px] text-emerald-500/70 font-mono mt-0.5">ESP32 P2P Network Active</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowBluetoothMock(true)}
                  className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/40 rounded text-emerald-400 transition-colors border border-emerald-500/30" title="Bluetooth LE Sync">
                  <Bluetooth className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => setShowCallMock(true)}
                  className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/40 rounded text-emerald-400 transition-colors border border-emerald-500/30" title="Wi-Fi Calling (VoIP)">
                  <Phone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Chat Feed */}
            <div className="flex-1 p-3 overflow-y-auto custom-scrollbar flex flex-col gap-3">
              <div className="text-center">
                <span className="text-[8px] bg-emerald-500/10 text-emerald-500/60 px-2 py-0.5 rounded-full font-mono border border-emerald-500/20">
                  Mesh connection secured. Encrypted channel open.
                </span>
              </div>
              
              <div className="bg-white/5 border border-white/5 p-2 rounded-lg rounded-tl-none self-start max-w-[85%]">
                <p className="text-[9px] text-neutral-400 font-mono mb-1">HQ Gateway (Auto)</p>
                <p className="text-xs text-white">Connection established. Awaiting priority dispatch.</p>
              </div>
            </div>

            {/* Quick Actions / Input */}
            <div className="p-3 border-t border-white/10 bg-black/40">
              <p className="text-[8px] text-neutral-500 uppercase font-black tracking-widest mb-2">Priority Quick-Dispatch</p>
              <div className="grid grid-cols-1 gap-1.5">
                {['Cardiac Arrest', 'NDRF B-Squad Requesting', 'Food Ration Running Low', 'Daily Support Status'].map((msg, i) => (
                  <button key={i} className="text-[10px] bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/50 text-neutral-300 hover:text-emerald-400 py-2 px-3 rounded text-left truncate transition-colors flex justify-between items-center group">
                    <span>{msg}</span>
                    <Send className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Mocks for Screen Recording */}
      {showCallMock && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-[2000] flex items-center justify-center pointer-events-auto">
          <div className="bg-neutral-900 border border-emerald-500/30 rounded-2xl p-6 flex flex-col items-center w-72 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 relative">
              <div className="absolute inset-0 rounded-full border border-emerald-500/50 animate-ping"></div>
              <Phone className="w-8 h-8 text-emerald-400 animate-pulse" />
            </div>
            <h3 className="text-white text-lg font-bold mb-1">HQ Command Center</h3>
            <p className="text-emerald-400 text-sm font-mono mb-6">VoIP Connected (Encrypted)</p>
            <p className="text-neutral-500 font-mono text-xs mb-8">00:03</p>
            <button 
              onClick={() => setShowCallMock(false)}
              className="w-14 h-14 rounded-full bg-red-500/20 hover:bg-red-500/40 border border-red-500 flex items-center justify-center transition-colors">
              <Phone className="w-6 h-6 text-red-500 rotate-[135deg]" />
            </button>
          </div>
        </div>
      )}

      {showBluetoothMock && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-[2000] flex items-center justify-center pointer-events-auto">
          <div className="bg-neutral-900 border border-blue-500/30 rounded-2xl p-6 flex flex-col items-center w-72 shadow-[0_0_50px_rgba(59,130,246,0.2)]">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-4 relative">
              <Bluetooth className="w-8 h-8 text-blue-400 animate-pulse" />
            </div>
            <h3 className="text-white text-lg font-bold mb-1">ESP32 Node Sync</h3>
            <p className="text-blue-400 text-sm font-mono mb-6">Pairing via BLE Mesh...</p>
            
            <div className="w-full space-y-2 mb-6">
              <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                <span>Handshake</span><span>OK</span>
              </div>
              <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                <span>Inventory Sync</span><span className="text-blue-400">Syncing...</span>
              </div>
            </div>

            <button 
              onClick={() => setShowBluetoothMock(false)}
              className="px-6 py-2 rounded bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-colors">
              Cancel Sync
            </button>
          </div>
        </div>
      )}
    </>
  );
}
