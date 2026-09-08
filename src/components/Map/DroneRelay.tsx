'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { Marker, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAppStore } from '@/store/useAppStore';
import { getQueuedActions, clearActionQueue } from '@/lib/offlineSync';

import { EMERGENCY_HUBS, type EmergencyHub } from '@/lib/emergencyHubs';
export { EMERGENCY_HUBS, type EmergencyHub };

// Linear interpolation
const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

// ── High-Tech Drone Quadcopter Icon Generator ────────────────────────
function createDroneIcon(callsign: string, color: string, isTethered: boolean = false, altText: string = '120M') {
  const rotorSpeed = isTethered ? '0.2s' : '0.15s';
  const pulseSpeed = isTethered ? '1s' : '0.8s';

  return L.divIcon({
    className: `custom-drone-icon-${callsign.toLowerCase()}`,
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; pointer-events: none; transform: translate(-50%, -50%);">
        <style>
          @keyframes rotorSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes beaconPulse { 0%, 100% { transform: scale(1); opacity: 0.9; } 50% { transform: scale(1.4); opacity: 0.3; } }
          @keyframes radarRing { 0% { transform: scale(0.6); opacity: 0.8; } 100% { transform: scale(1.6); opacity: 0; } }
        </style>
        
        <!-- Expanding Radar Ping Wave -->
        <div style="position: absolute; top: 20px; left: 50%; width: 44px; height: 44px; margin-left: -22px; margin-top: -22px; border-radius: 50%; border: 1.5px solid ${color}; animation: radarRing ${pulseSpeed} infinite ease-out; pointer-events: none;"></div>

        <!-- Quadcopter Drone Body -->
        <div style="position: relative; width: 42px; height: 42px; background: rgba(5, 10, 20, 0.95); border-radius: 50%; border: 2px solid ${color}; box-shadow: 0 0 16px ${color}88, inset 0 0 8px ${color}44; display: flex; align-items: center; justify-content: center; z-index: 2;">
          
          <!-- 4 Diagonal Rotor Arms -->
          <div style="position: absolute; width: 34px; height: 2px; background: ${color}; transform: rotate(45deg); opacity: 0.85;"></div>
          <div style="position: absolute; width: 34px; height: 2px; background: ${color}; transform: rotate(-45deg); opacity: 0.85;"></div>

          <!-- 4 Rotor Discs with Spinning Blades -->
          <div style="position: absolute; top: 2px; left: 2px; width: 10px; height: 10px; border-radius: 50%; border: 1px dashed ${color}; animation: rotorSpin ${rotorSpeed} infinite linear;"></div>
          <div style="position: absolute; top: 2px; right: 2px; width: 10px; height: 10px; border-radius: 50%; border: 1px dashed ${color}; animation: rotorSpin ${rotorSpeed} infinite linear;"></div>
          <div style="position: absolute; bottom: 2px; left: 2px; width: 10px; height: 10px; border-radius: 50%; border: 1px dashed ${color}; animation: rotorSpin ${rotorSpeed} infinite linear;"></div>
          <div style="position: absolute; bottom: 2px; right: 2px; width: 10px; height: 10px; border-radius: 50%; border: 1px dashed ${color}; animation: rotorSpin ${rotorSpeed} infinite linear;"></div>

          <!-- Central Transceiver Core -->
          <div style="position: relative; width: 14px; height: 14px; background: ${color}; border-radius: 50%; box-shadow: 0 0 10px ${color}; display: flex; align-items: center; justify-content: center; animation: beaconPulse 1.2s infinite ease-in-out;">
            <div style="width: 5px; height: 5px; background: #ffffff; border-radius: 50%;"></div>
          </div>
        </div>

        <!-- Tactical HUD Callsign Badge -->
        <div style="margin-top: 3px; background: rgba(0, 0, 0, 0.92); border: 1px solid ${color}; border-radius: 4px; padding: 1px 5px; box-shadow: 0 2px 8px rgba(0,0,0,0.8); display: flex; align-items: center; gap: 3px; z-index: 3; white-space: nowrap;">
          <span style="display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: ${color};"></span>
          <span style="color: #ffffff; font-family: monospace; font-size: 8px; font-weight: 900; letter-spacing: 0.5px;">${callsign}</span>
          <span style="color: ${color}; font-family: monospace; font-size: 7px; font-weight: 700;">${altText}</span>
        </div>
      </div>
    `,
    iconSize: [44, 60],
    iconAnchor: [22, 21],
  });
}

// ── Base Station Hub Icon Generator ──────────────────────────────────
function createBaseStationIcon(name: string, roleCode: string, color: string, isOrigin: boolean) {
  return L.divIcon({
    className: `base-hub-marker-${roleCode.toLowerCase()}`,
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; pointer-events: none; transform: translate(-50%, -50%);">
        <style>
          @keyframes hubPulse { 0% { transform: scale(0.8); opacity: 0.8; } 100% { transform: scale(1.8); opacity: 0; } }
        </style>
        
        <!-- Radiating Base Pulse -->
        <div style="position: absolute; top: 18px; left: 50%; width: 38px; height: 38px; margin-left: -19px; margin-top: -19px; border-radius: 50%; border: 2px solid ${color}; animation: hubPulse 2s infinite ease-out;"></div>

        <!-- Base Tower Node -->
        <div style="width: 36px; height: 36px; background: rgba(10, 15, 25, 0.95); border: 2.5px solid ${color}; border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 16px ${color}99, inset 0 0 8px ${color}44; z-index: 2;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/>
            <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/>
            <circle cx="12" cy="12" r="2"/>
            <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/>
            <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/>
          </svg>
        </div>

        <!-- Base Station Tag -->
        <div style="margin-top: 3px; background: rgba(0, 0, 0, 0.92); border: 1.5px solid ${color}; border-radius: 4px; padding: 2px 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.8); text-align: center; z-index: 3; white-space: nowrap;">
          <div style="color: ${color}; font-family: monospace; font-size: 7px; font-weight: 900; letter-spacing: 0.8px;">${isOrigin ? 'ORIGIN HUB A' : 'DESTINATION HUB B'}</div>
          <div style="color: #ffffff; font-family: sans-serif; font-size: 9px; font-weight: 800;">${name}</div>
        </div>
      </div>
    `,
    iconSize: [50, 68],
    iconAnchor: [25, 18],
  });
}

export interface DroneState {
  id: string;
  callsign: string;
  originId: string;
  startPos: [number, number];
  targetPos: [number, number];
  currentPos: [number, number];
  speed: number;
  flightDurationMs: number;
  batteryPct: number;
  departureSide: 'A' | 'B';
  alt: string;
}

interface DroneRelayProps {
  userLocation?: [number, number];
}

export function DroneRelay({ userLocation: _ }: DroneRelayProps) {
  const { 
    isDroneDeployed, 
    deliverQueuedMessages, 
    hopQueuedMessages, 
    syncOfflineActions,
    rfMode,
    dronePowerMode,
    originHubId,
    destHubId
  } = useAppStore();

  const [drones, setDrones] = useState<DroneState[]>([]);
  const [meshActive, setMeshActive] = useState(false);
  const [flightProgress, setFlightProgress] = useState(0);

  const animationRef = useRef<number | undefined>(undefined);
  const deliveredRef = useRef(false);
  const map = useMap();

  const hubA = EMERGENCY_HUBS.find(h => h.id === originHubId) || EMERGENCY_HUBS[0];
  const hubB = EMERGENCY_HUBS.find(h => h.id === destHubId) || EMERGENCY_HUBS[3];

  // Memoized Base Station Icons
  const hubAIcon = useMemo(() => createBaseStationIcon(hubA.name, hubA.id, '#10b981', true), [hubA.name, hubA.id]);
  const hubBIcon = useMemo(() => createBaseStationIcon(hubB.name, hubB.id, '#f59e0b', false), [hubB.name, hubB.id]);

  useEffect(() => {
    if (!isDroneDeployed) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      setDrones([]);
      setMeshActive(false);
      setFlightProgress(0);
      deliveredRef.current = false;
      return;
    }

    // 4 Strategic Relay Waypoints along the line between Hub A and Hub B:
    // Drone A1 stays at 20% distance
    // Drone A2 pushes to 40% distance
    // Drone B2 pushes to 60% distance
    // Drone B1 stays at 80% distance
    const wp1: [number, number] = [lerp(hubA.pos[0], hubB.pos[0], 0.20), lerp(hubA.pos[1], hubB.pos[1], 0.20)];
    const wp2: [number, number] = [lerp(hubA.pos[0], hubB.pos[0], 0.40), lerp(hubA.pos[1], hubB.pos[1], 0.40)];
    const wp3: [number, number] = [lerp(hubA.pos[0], hubB.pos[0], 0.60), lerp(hubA.pos[1], hubB.pos[1], 0.60)];
    const wp4: [number, number] = [lerp(hubA.pos[0], hubB.pos[0], 0.80), lerp(hubA.pos[1], hubB.pos[1], 0.80)];

    // Initial slight offset at base station so D1 and D2 are individually distinguishable at takeoff
    const offsetA: [number, number] = [
      hubA.pos[0] + (hubB.pos[0] - hubA.pos[0]) * 0.03,
      hubA.pos[1] + (hubB.pos[1] - hubA.pos[1]) * 0.03,
    ];
    const offsetB: [number, number] = [
      hubB.pos[0] + (hubA.pos[0] - hubB.pos[0]) * 0.03,
      hubB.pos[1] + (hubA.pos[1] - hubB.pos[1]) * 0.03,
    ];

    const flightDurationMs = 5200; // 5.2s cinematic flight into formation

    const initialDrones: DroneState[] = [
      // 2 Drones Dispatched from Hub A (Origin)
      {
        id: `DRN-${hubA.id}-A1`,
        callsign: 'DRN-A1',
        originId: hubA.id,
        startPos: offsetA,
        targetPos: wp1,
        currentPos: offsetA,
        speed: 55,
        flightDurationMs,
        batteryPct: 98,
        departureSide: 'A',
        alt: '110M'
      },
      {
        id: `DRN-${hubA.id}-A2`,
        callsign: 'DRN-A2',
        originId: hubA.id,
        startPos: hubA.pos,
        targetPos: wp2,
        currentPos: hubA.pos,
        speed: 62,
        flightDurationMs,
        batteryPct: 96,
        departureSide: 'A',
        alt: '125M'
      },
      // 2 Drones Dispatched from Hub B (Destination)
      {
        id: `DRN-${hubB.id}-B2`,
        callsign: 'DRN-B2',
        originId: hubB.id,
        startPos: hubB.pos,
        targetPos: wp3,
        currentPos: hubB.pos,
        speed: 60,
        flightDurationMs,
        batteryPct: 95,
        departureSide: 'B',
        alt: '130M'
      },
      {
        id: `DRN-${hubB.id}-B1`,
        callsign: 'DRN-B1',
        originId: hubB.id,
        startPos: offsetB,
        targetPos: wp4,
        currentPos: offsetB,
        speed: 54,
        flightDurationMs,
        batteryPct: 97,
        departureSide: 'B',
        alt: '115M'
      }
    ];

    setDrones(initialDrones);
    setMeshActive(false);
    setFlightProgress(0);
    deliveredRef.current = false;

    // Zoom map smoothly to encompass both hubs with generous view margin
    const bounds = L.latLngBounds([hubA.pos, hubB.pos]);
    map.flyToBounds(bounds, { padding: [90, 90], duration: 1.6 });

    let startTime: number | null = null;
    let hasHopped = false;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      
      // Deterministic progress calculation independent of React state queues
      const rawProgress = Math.min(elapsed / flightDurationMs, 1);
      
      // Smooth cubic ease-in-out curve
      const easeProgress = rawProgress < 0.5
        ? 4 * rawProgress * rawProgress * rawProgress
        : 1 - Math.pow(-2 * rawProgress + 2, 3) / 2;

      setFlightProgress(rawProgress);

      setDrones([
        {
          ...initialDrones[0],
          currentPos: [
            lerp(initialDrones[0].startPos[0], initialDrones[0].targetPos[0], easeProgress),
            lerp(initialDrones[0].startPos[1], initialDrones[0].targetPos[1], easeProgress),
          ]
        },
        {
          ...initialDrones[1],
          currentPos: [
            lerp(initialDrones[1].startPos[0], initialDrones[1].targetPos[0], easeProgress),
            lerp(initialDrones[1].startPos[1], initialDrones[1].targetPos[1], easeProgress),
          ]
        },
        {
          ...initialDrones[2],
          currentPos: [
            lerp(initialDrones[2].startPos[0], initialDrones[2].targetPos[0], easeProgress),
            lerp(initialDrones[2].startPos[1], initialDrones[2].targetPos[1], easeProgress),
          ]
        },
        {
          ...initialDrones[3],
          currentPos: [
            lerp(initialDrones[3].startPos[0], initialDrones[3].targetPos[0], easeProgress),
            lerp(initialDrones[3].startPos[1], initialDrones[3].targetPos[1], easeProgress),
          ]
        }
      ]);

      if (elapsed > 1200 && !hasHopped) {
        hasHopped = true;
        hopQueuedMessages();
      }

      if (rawProgress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Arrival complete: lock high-speed mesh
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

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isDroneDeployed, originHubId, destHubId, map, hopQueuedMessages, deliverQueuedMessages, syncOfflineActions]);

  // Extract current positions for dynamic real-time mesh polylines
  const posA1 = drones[0]?.currentPos;
  const posA2 = drones[1]?.currentPos;
  const posB2 = drones[2]?.currentPos;
  const posB1 = drones[3]?.currentPos;

  // Mid-point of the corridor for the live status label
  const corridorMidPoint: [number, number] = [
    lerp(hubA.pos[0], hubB.pos[0], 0.5),
    lerp(hubA.pos[1], hubB.pos[1], 0.5),
  ];

  const statusLabelIcon = useMemo(() => {
    const isLocked = meshActive || flightProgress >= 1;
    const pct = Math.round(flightProgress * 100);
    const text = isLocked 
      ? `TACTICAL MESH LOCKED • DUAL-ORIGIN SWARM ACTIVE`
      : `DEPLOYING 4-DRONE SWARM • ESTABLISHING MESH (${pct}%)`;

    return L.divIcon({
      className: 'swarm-status-pill',
      html: `
        <div style="background: rgba(5, 10, 20, 0.92); border: 1.5px solid ${isLocked ? '#10b981' : '#f59e0b'}; border-radius: 999px; padding: 4px 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.8); display: flex; align-items: center; gap: 6px; white-space: nowrap; transform: translate(-50%, -50%);">
          <span style="width: 7px; height: 7px; border-radius: 50%; background: ${isLocked ? '#10b981' : '#f59e0b'}; box-shadow: 0 0 8px ${isLocked ? '#10b981' : '#f59e0b'};"></span>
          <span style="color: #ffffff; font-family: monospace; font-size: 9px; font-weight: 900; letter-spacing: 0.8px;">${text}</span>
        </div>
      `,
      iconSize: [280, 26],
      iconAnchor: [140, 13],
    });
  }, [meshActive, flightProgress]);

  return (
    <>
      {/* ── 1. Base Station Hub Markers (Origin A & Destination B) ───── */}
      <Marker position={hubA.pos} icon={hubAIcon} zIndexOffset={500} />
      <Marker position={hubB.pos} icon={hubBIcon} zIndexOffset={500} />

      {/* Base Station Radar Rings */}
      <Circle
        center={hubA.pos}
        radius={350}
        pathOptions={{
          color: '#10b981',
          fillColor: '#10b981',
          fillOpacity: 0.12,
          weight: 2,
          dashArray: '4, 4'
        }}
      />
      <Circle
        center={hubB.pos}
        radius={350}
        pathOptions={{
          color: '#f59e0b',
          fillColor: '#f59e0b',
          fillOpacity: 0.12,
          weight: 2,
          dashArray: '4, 4'
        }}
      />

      {/* ── 2. Departure Trajectory Trails (Hub to Current Drone) ────── */}
      {isDroneDeployed && drones.map((drone) => (
        <Polyline
          key={`trail-${drone.id}`}
          positions={[drone.startPos, drone.currentPos]}
          pathOptions={{
            color: drone.departureSide === 'A' ? '#10b981' : '#f59e0b',
            weight: 2,
            dashArray: '4, 4',
            opacity: 0.65
          }}
        />
      ))}

      {/* ── 3. LIVE DYNAMIC MESH FORMATION WHILE FLYING & LOCKED ─────── */}
      {/* Link 1: Hub A ↔ Drone A1 */}
      {isDroneDeployed && posA1 && (
        <Polyline
          positions={[hubA.pos, posA1]}
          pathOptions={{
            color: '#10b981',
            weight: 3.5,
            opacity: 0.95,
            dashArray: meshActive ? undefined : '8, 8'
          }}
        />
      )}

      {/* Link 2: Drone A1 ↔ Drone A2 */}
      {isDroneDeployed && posA1 && posA2 && (
        <Polyline
          positions={[posA1, posA2]}
          pathOptions={{
            color: '#10b981',
            weight: 3.5,
            opacity: 0.95,
            dashArray: meshActive ? undefined : '8, 8'
          }}
        />
      )}

      {/* Link 3: CENTRAL HANDSHAKE: Drone A2 ↔ Drone B2 */}
      {/* Forms dynamically as drones progress out past 25% */}
      {isDroneDeployed && posA2 && posB2 && flightProgress > 0.25 && (
        <Polyline
          positions={[posA2, posB2]}
          pathOptions={{
            color: meshActive ? '#10b981' : '#38bdf8',
            weight: meshActive ? 4 : 2.5,
            opacity: meshActive ? 1 : Math.min((flightProgress - 0.25) * 1.8, 0.9),
            dashArray: meshActive ? undefined : '6, 6'
          }}
        />
      )}

      {/* Link 4: Drone B2 ↔ Drone B1 */}
      {isDroneDeployed && posB2 && posB1 && (
        <Polyline
          positions={[posB2, posB1]}
          pathOptions={{
            color: '#f59e0b',
            weight: 3.5,
            opacity: 0.95,
            dashArray: meshActive ? undefined : '8, 8'
          }}
        />
      )}

      {/* Link 5: Drone B1 ↔ Hub B */}
      {isDroneDeployed && posB1 && (
        <Polyline
          positions={[posB1, hubB.pos]}
          pathOptions={{
            color: '#f59e0b',
            weight: 3.5,
            opacity: 0.95,
            dashArray: meshActive ? undefined : '8, 8'
          }}
        />
      )}

      {/* ── 4. Live Status Pill at Corridor Midpoint ─────────────────── */}
      {isDroneDeployed && (
        <Marker position={corridorMidPoint} icon={statusLabelIcon} zIndexOffset={800} />
      )}

      {/* ── 5. The 4 Live Animated Quadcopter Drones ─────────────────── */}
      {isDroneDeployed && drones.map((drone) => {
        const isTether = dronePowerMode === 'tethered';
        const color = isTether ? '#06b6d4' : drone.departureSide === 'A' ? '#10b981' : '#f59e0b';
        const icon = createDroneIcon(drone.callsign, color, isTether, drone.alt);

        return (
          <Marker 
            key={drone.id}
            position={drone.currentPos} 
            icon={icon} 
            zIndexOffset={1000} 
          />
        );
      })}

      {/* ── 6. Live RF Coverage Fields ───────────────────────────────── */}
      {isDroneDeployed && drones.map((drone) => (
        <Circle 
          key={`rf-${drone.id}`}
          center={drone.currentPos} 
          radius={rfMode === 'lora' ? 550 : 380} 
          pathOptions={{ 
            color: drone.departureSide === 'A' ? '#10b981' : '#f59e0b', 
            fillColor: drone.departureSide === 'A' ? '#10b981' : '#f59e0b', 
            fillOpacity: meshActive ? 0.12 : 0.06, 
            weight: 1, 
            dashArray: rfMode === 'lora' ? '4, 4' : '2, 2' 
          }} 
        />
      ))}
    </>
  );
}
