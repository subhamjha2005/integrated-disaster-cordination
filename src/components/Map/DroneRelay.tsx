'use client';

import { useEffect, useState, useRef } from 'react';
import { Marker, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAppStore } from '@/store/useAppStore';
import { getQueuedActions, clearActionQueue } from '@/lib/offlineSync';

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

// High-visibility illuminated drone icons
const DroneIconA = L.divIcon({
  className: 'custom-drone-icon-a',
  html: `
    <div style="display: flex; flex-direction: column; align-items: center; pointer-events: none; filter: drop-shadow(0 0 10px #10b981);">
      <div style="width: 32px; height: 32px; background: #022c22; border: 2.5px solid #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 16px rgba(16,185,129,0.9);">
        <span style="font-size: 15px; line-height: 1;">🛸</span>
      </div>
      <span style="background: rgba(0,0,0,0.9); color: #34d399; font-size: 8px; font-weight: 900; padding: 1px 4px; border-radius: 4px; border: 1px solid #10b981; margin-top: 2px; white-space: nowrap;">DRN-A</span>
    </div>
  `,
  iconSize: [36, 48],
  iconAnchor: [18, 16],
});

const DroneIconB = L.divIcon({
  className: 'custom-drone-icon-b',
  html: `
    <div style="display: flex; flex-direction: column; align-items: center; pointer-events: none; filter: drop-shadow(0 0 10px #f59e0b);">
      <div style="width: 32px; height: 32px; background: #451a03; border: 2.5px solid #f59e0b; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 16px rgba(245,158,11,0.9);">
        <span style="font-size: 15px; line-height: 1;">🛸</span>
      </div>
      <span style="background: rgba(0,0,0,0.9); color: #fbbf24; font-size: 8px; font-weight: 900; padding: 1px 4px; border-radius: 4px; border: 1px solid #f59e0b; margin-top: 2px; white-space: nowrap;">DRN-B</span>
    </div>
  `,
  iconSize: [36, 48],
  iconAnchor: [18, 16],
});

const TetheredDroneIcon = L.divIcon({
  className: 'custom-tethered-drone-icon',
  html: `
    <div style="display: flex; flex-direction: column; align-items: center; pointer-events: none; filter: drop-shadow(0 0 10px #06b6d4);">
      <div style="width: 32px; height: 32px; background: #083344; border: 2.5px solid #06b6d4; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 16px rgba(6,182,212,0.9);">
        <span style="font-size: 15px; line-height: 1;">⚡</span>
      </div>
      <span style="background: rgba(0,0,0,0.9); color: #22d3ee; font-size: 8px; font-weight: 900; padding: 1px 4px; border-radius: 4px; border: 1px solid #06b6d4; margin-top: 2px; white-space: nowrap;">TETHERED</span>
    </div>
  `,
  iconSize: [36, 48],
  iconAnchor: [18, 16],
});

export interface DroneState {
  id: string;
  originId: string;
  startPos: [number, number];
  targetPos: [number, number];
  currentPos: [number, number];
  speed: number;
  flightDurationMs: number;
  batteryPct: number;
  departureSide: 'A' | 'B';
}

interface DroneRelayProps {
  userLocation?: [number, number];
}

export function DroneRelay({ userLocation }: DroneRelayProps) {
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
  const [meshLinks, setMeshLinks] = useState<[ [number, number], [number, number] ][]>([]);
  const [meshActive, setMeshActive] = useState(false);

  const animationRef = useRef<number | undefined>(undefined);
  const deliveredRef = useRef(false);
  const map = useMap();

  const hubA = EMERGENCY_HUBS.find(h => h.id === originHubId) || EMERGENCY_HUBS[0];
  const hubB = EMERGENCY_HUBS.find(h => h.id === destHubId) || EMERGENCY_HUBS[3];

  useEffect(() => {
    if (!isDroneDeployed) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      setDrones([]);
      setMeshLinks([]);
      setMeshActive(false);
      deliveredRef.current = false;
      return;
    }

    // Waypoints at 20%, 40%, 60%, 80% distance between Hub A and Hub B
    const wp1: [number, number] = [lerp(hubA.pos[0], hubB.pos[0], 0.2), lerp(hubA.pos[1], hubB.pos[1], 0.2)];
    const wp2: [number, number] = [lerp(hubA.pos[0], hubB.pos[0], 0.4), lerp(hubA.pos[1], hubB.pos[1], 0.4)];
    const wp3: [number, number] = [lerp(hubA.pos[0], hubB.pos[0], 0.6), lerp(hubA.pos[1], hubB.pos[1], 0.6)];
    const wp4: [number, number] = [lerp(hubA.pos[0], hubB.pos[0], 0.8), lerp(hubA.pos[1], hubB.pos[1], 0.8)];

    // 5 seconds visible departure flight
    const flightDurationMs = 5000;

    const initialDrones: DroneState[] = [
      // 2 Drones Dispatched from Location A (Hub A building)
      {
        id: `DRN-${hubA.id}-A1`,
        originId: hubA.id,
        startPos: hubA.pos,
        targetPos: wp1,
        currentPos: hubA.pos,
        speed: 55,
        flightDurationMs,
        batteryPct: 98,
        departureSide: 'A'
      },
      {
        id: `DRN-${hubA.id}-A2`,
        originId: hubA.id,
        startPos: hubA.pos,
        targetPos: wp2,
        currentPos: hubA.pos,
        speed: 58,
        flightDurationMs,
        batteryPct: 95,
        departureSide: 'A'
      },
      // 2 Drones Dispatched from Location B (Hub B building)
      {
        id: `DRN-${hubB.id}-B1`,
        originId: hubB.id,
        startPos: hubB.pos,
        targetPos: wp4,
        currentPos: hubB.pos,
        speed: 52,
        flightDurationMs,
        batteryPct: 96,
        departureSide: 'B'
      },
      {
        id: `DRN-${hubB.id}-B2`,
        originId: hubB.id,
        startPos: hubB.pos,
        targetPos: wp3,
        currentPos: hubB.pos,
        speed: 56,
        flightDurationMs,
        batteryPct: 94,
        departureSide: 'B'
      }
    ];

    setDrones(initialDrones);
    setMeshActive(false);
    deliveredRef.current = false;

    // Zoom map smoothly to encompass both buildings
    const bounds = L.latLngBounds([hubA.pos, hubB.pos]);
    map.flyToBounds(bounds, { padding: [80, 80], duration: 1.5 });

    let startTime: number | null = null;
    let hasHopped = false;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      
      let allArrived = true;

      setDrones(prev => {
        return prev.map(d => {
          const progress = Math.min(elapsed / d.flightDurationMs, 1);
          if (progress < 1) allArrived = false;

          // Smooth quadratic easing
          const easeProgress = progress < 0.5 
            ? 2 * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

          return {
            ...d,
            currentPos: [
              lerp(d.startPos[0], d.targetPos[0], easeProgress),
              lerp(d.startPos[1], d.targetPos[1], easeProgress)
            ] as [number, number]
          };
        });
      });

      if (elapsed > 1200 && !hasHopped) {
        hasHopped = true;
        hopQueuedMessages();
      }

      if (!allArrived) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setMeshActive(true);
        // Lock unbroken mesh polyline connecting Hub A ↔ 4 Drones ↔ Hub B
        setMeshLinks([
          [hubA.pos, wp1],
          [wp1, wp2],
          [wp2, wp3],
          [wp3, wp4],
          [wp4, hubB.pos]
        ]);

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
  }, [isDroneDeployed, originHubId, destHubId, map]);

  return (
    <>
      {/* 1. Highlight Origin & Destination Buildings with Pulsing Rings */}
      <Circle
        center={hubA.pos}
        radius={280}
        pathOptions={{
          color: '#10b981',
          fillColor: '#10b981',
          fillOpacity: 0.2,
          weight: 2,
          dashArray: '4, 4'
        }}
      />
      <Circle
        center={hubB.pos}
        radius={280}
        pathOptions={{
          color: '#f59e0b',
          fillColor: '#f59e0b',
          fillOpacity: 0.2,
          weight: 2,
          dashArray: '4, 4'
        }}
      />

      {/* 2. Departure Flight Path Trajectory Trails (from buildings to drones) */}
      {isDroneDeployed && drones.map((drone) => (
        <Polyline
          key={`trail-${drone.id}`}
          positions={[drone.startPos, drone.currentPos]}
          pathOptions={{
            color: drone.departureSide === 'A' ? '#10b981' : '#f59e0b',
            weight: 2.5,
            dashArray: '6, 6',
            opacity: 0.75
          }}
        />
      ))}

      {/* 3. Locked Inter-Hub Mesh Polyline (Once arrived) */}
      {meshActive && meshLinks.map((link, idx) => (
        <Polyline 
          key={`mesh-${idx}`} 
          positions={link} 
          pathOptions={{ color: '#10b981', weight: 4, opacity: 0.95 }} 
          className="animate-pulse"
        />
      ))}

      {/* 4. The 4 Live Animated Drones */}
      {isDroneDeployed && drones.map((drone) => (
        <Marker 
          key={drone.id}
          position={drone.currentPos} 
          icon={
            dronePowerMode === 'tethered' 
              ? TetheredDroneIcon 
              : drone.departureSide === 'A' 
              ? DroneIconA 
              : DroneIconB
          } 
          zIndexOffset={1000} 
        />
      ))}

      {/* 5. Drone RF Coverage Circles */}
      {meshActive && drones.map((drone) => (
        <Circle 
          key={`rf-${drone.id}`}
          center={drone.currentPos} 
          radius={rfMode === 'lora' ? 550 : 350} 
          pathOptions={{ 
            color: drone.departureSide === 'A' ? '#10b981' : '#f59e0b', 
            fillColor: drone.departureSide === 'A' ? '#10b981' : '#f59e0b', 
            fillOpacity: 0.1, 
            weight: 1, 
            dashArray: rfMode === 'lora' ? '4, 4' : '2, 2' 
          }} 
        />
      ))}
    </>
  );
}
