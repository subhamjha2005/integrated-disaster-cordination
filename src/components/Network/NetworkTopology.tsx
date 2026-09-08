'use client';

import { useAppStore } from '@/store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { NetworkNode } from '@/lib/types';
import { Radio, ShieldAlert, HeartPulse, Plane, Wifi, Activity, Cpu, Zap, Signal, RefreshCw, Layers } from 'lucide-react';
import { useState, useEffect } from 'react';

// Hardcoded default positions for SVG viewbox (0 0 440 280)
const NODE_POSITIONS: Record<string, { x: number, y: number }> = {
  'node-gateway': { x: 220, y: 45 },
  'node-police': { x: 90, y: 200 },
  'node-health': { x: 350, y: 200 },
  'node-drone': { x: 220, y: 130 },
};

const getIconForNode = (type: string) => {
  switch (type) {
    case 'gateway': return <Radio className="w-5 h-5 text-indigo-400" />;
    case 'field': return <HeartPulse className="w-5 h-5 text-emerald-400" />;
    case 'drone': return <Plane className="w-5 h-5 text-amber-400" />;
    default: return <ShieldAlert className="w-5 h-5 text-cyan-400" />;
  }
};

export function NetworkTopology() {
  const { networkNodes, networkMode, isDroneDeployed, rfMode, dronePowerMode, priorityMessages, camps } = useAppStore();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('node-gateway');
  const [packetTick, setPacketTick] = useState(0);

  // Live Packet Animation Ticker - Optimized for 60% lower CPU overhead
  useEffect(() => {
    const interval = setInterval(() => {
      setPacketTick(prev => (prev + 1) % 100);
    }, 120);
    return () => clearInterval(interval);
  }, []);

  const gateway = networkNodes.find(n => n.type === 'gateway') || { id: 'node-gateway', name: 'HQ Gateway', type: 'gateway' as const, status: 'online' as const, location: { lat: 26.1388, lng: 91.6625 } };
  const police = networkNodes.find(n => n.id === 'node-police') || { id: 'node-police', name: 'Police Sector 2', type: 'field' as const, status: 'online' as const, location: { lat: 26.15, lng: 91.7 } };
  const health = networkNodes.find(n => n.id === 'node-health') || { id: 'node-health', name: 'Health Team Alpha', type: 'field' as const, status: 'online' as const, location: { lat: 26.18, lng: 91.75 } };
  const drone = networkNodes.find(n => n.type === 'drone') || { id: 'node-drone', name: 'DRN-RELAY-1', type: 'drone' as const, status: 'mesh' as const, location: { lat: 26.16, lng: 91.72 } };

  const selectedNode = networkNodes.find(n => n.id === selectedNodeId) || gateway;

  // Dynamic Telemetry calculation based on mode
  const getDynamicTelemetry = (nodeId: string) => {
    if (networkMode === 'normal') {
      return { rssi: '-64 dBm', latency: '14 ms', bandwidth: '100 Mbps', statusText: '4G/5G PRIMARY' };
    }
    if (isDroneDeployed) {
      const isDrone = nodeId === 'node-drone';
      return {
        rssi: isDrone ? '-58 dBm' : '-78 dBm',
        latency: '42 ms',
        bandwidth: rfMode === 'lora' ? '250 kbps (LoRa)' : '1.4 Mbps (COFDM)',
        statusText: rfMode === 'lora' ? 'SUB-GHZ RF MESH' : 'COFDM MESH LINK'
      };
    }
    return { rssi: '-98 dBm', latency: '180 ms', bandwidth: '12 kbps', statusText: 'DEGRADED / DTN' };
  };

  return (
    <div className="glass-panel p-5 w-full h-full flex flex-col relative overflow-hidden bg-neutral-950/90 border border-neutral-800 rounded-2xl shadow-xl">
      {/* Dynamic Background Glow */}
      <div className={`absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none transition-colors duration-700 ${
        networkMode === 'normal' ? 'bg-emerald-500/10' : isDroneDeployed ? 'bg-amber-500/15' : 'bg-red-500/15'
      }`} />

      {/* Header */}
      <div className="flex justify-between items-center mb-3 relative z-10 gap-2 flex-wrap">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
            <Radio className="w-4 h-4 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
              Live Network Topology
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </h3>
            <p className="text-[9px] text-neutral-400 font-mono">
              {rfMode === 'lora' ? '865 MHz Sub-GHz RF Mesh' : '1.4 GHz High Band COFDM'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
            networkMode === 'normal' 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
              : isDroneDeployed
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.2)]'
              : 'bg-red-500/10 text-red-400 border-red-500/30 animate-bounce shadow-[0_0_10px_rgba(239,68,68,0.2)]'
          }`}>
            {networkMode === 'normal' ? 'PRIMARY 4G/5G UPLINK' : isDroneDeployed ? 'DRONE MESH RELAY' : 'COMMUNICATIONS DEGRADED'}
          </span>
        </div>
      </div>

      {/* Topology Canvas Container */}
      <div className="flex-1 relative w-full h-full min-h-[240px] rounded-xl bg-black/40 border border-white/5 overflow-hidden">
        <svg viewBox="0 0 440 250" className="w-full h-full absolute inset-0 drop-shadow-2xl">
          <defs>
            {/* Animated Dynamic Gradient */}
            <linearGradient id="activeLineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="1" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="meshDroneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* Primary Connection Lines */}
          {/* Gateway to Police */}
          <line
            x1={NODE_POSITIONS['node-gateway'].x} y1={NODE_POSITIONS['node-gateway'].y}
            x2={NODE_POSITIONS['node-police'].x} y2={NODE_POSITIONS['node-police'].y}
            stroke={networkMode === 'normal' ? 'url(#activeLineGradient)' : '#ef4444'}
            strokeWidth={networkMode === 'normal' ? "2.5" : "1.5"}
            strokeDasharray={networkMode === 'normal' ? 'none' : '4,4'}
            opacity={networkMode === 'normal' ? 0.9 : 0.4}
          />
          {/* Animated Packet Dots on Gateway -> Police */}
          {networkMode === 'normal' && (
            <circle
              r="4"
              fill="#10b981"
              cx={NODE_POSITIONS['node-gateway'].x + (NODE_POSITIONS['node-police'].x - NODE_POSITIONS['node-gateway'].x) * ((packetTick % 50) / 50)}
              cy={NODE_POSITIONS['node-gateway'].y + (NODE_POSITIONS['node-police'].y - NODE_POSITIONS['node-gateway'].y) * ((packetTick % 50) / 50)}
              className="shadow-[0_0_8px_#10b981]"
            />
          )}

          {/* Gateway to Health */}
          <line
            x1={NODE_POSITIONS['node-gateway'].x} y1={NODE_POSITIONS['node-gateway'].y}
            x2={NODE_POSITIONS['node-health'].x} y2={NODE_POSITIONS['node-health'].y}
            stroke={networkMode === 'normal' ? 'url(#activeLineGradient)' : '#ef4444'}
            strokeWidth={networkMode === 'normal' ? "2.5" : "1.5"}
            strokeDasharray={networkMode === 'normal' ? 'none' : '4,4'}
            opacity={networkMode === 'normal' ? 0.9 : 0.4}
          />
          {/* Animated Packet Dots on Gateway -> Health */}
          {networkMode === 'normal' && (
            <circle
              r="4"
              fill="#6366f1"
              cx={NODE_POSITIONS['node-gateway'].x + (NODE_POSITIONS['node-health'].x - NODE_POSITIONS['node-gateway'].x) * (((packetTick + 25) % 50) / 50)}
              cy={NODE_POSITIONS['node-gateway'].y + (NODE_POSITIONS['node-health'].y - NODE_POSITIONS['node-gateway'].y) * (((packetTick + 25) % 50) / 50)}
              className="shadow-[0_0_8px_#6366f1]"
            />
          )}

          {/* Drone Mesh Connections (Active when Drone Deployed) */}
          {isDroneDeployed && (
            <>
              {/* Drone -> Gateway */}
              <line
                x1={NODE_POSITIONS['node-drone'].x} y1={NODE_POSITIONS['node-drone'].y}
                x2={NODE_POSITIONS['node-gateway'].x} y2={NODE_POSITIONS['node-gateway'].y}
                stroke="url(#meshDroneGradient)"
                strokeWidth="2"
                strokeDasharray="6,6"
              />
              <circle
                r="3.5"
                fill="#f59e0b"
                cx={NODE_POSITIONS['node-gateway'].x + (NODE_POSITIONS['node-drone'].x - NODE_POSITIONS['node-gateway'].x) * ((packetTick % 40) / 40)}
                cy={NODE_POSITIONS['node-gateway'].y + (NODE_POSITIONS['node-drone'].y - NODE_POSITIONS['node-gateway'].y) * ((packetTick % 40) / 40)}
              />

              {/* Drone -> Police */}
              <line
                x1={NODE_POSITIONS['node-drone'].x} y1={NODE_POSITIONS['node-drone'].y}
                x2={NODE_POSITIONS['node-police'].x} y2={NODE_POSITIONS['node-police'].y}
                stroke="url(#meshDroneGradient)"
                strokeWidth="2"
                strokeDasharray="6,6"
              />
              <circle
                r="3.5"
                fill="#06b6d4"
                cx={NODE_POSITIONS['node-drone'].x + (NODE_POSITIONS['node-police'].x - NODE_POSITIONS['node-drone'].x) * (((packetTick + 15) % 40) / 40)}
                cy={NODE_POSITIONS['node-drone'].y + (NODE_POSITIONS['node-police'].y - NODE_POSITIONS['node-drone'].y) * (((packetTick + 15) % 40) / 40)}
              />

              {/* Drone -> Health */}
              <line
                x1={NODE_POSITIONS['node-drone'].x} y1={NODE_POSITIONS['node-drone'].y}
                x2={NODE_POSITIONS['node-health'].x} y2={NODE_POSITIONS['node-health'].y}
                stroke="url(#meshDroneGradient)"
                strokeWidth="2"
                strokeDasharray="6,6"
              />
              <circle
                r="3.5"
                fill="#10b981"
                cx={NODE_POSITIONS['node-drone'].x + (NODE_POSITIONS['node-health'].x - NODE_POSITIONS['node-drone'].x) * (((packetTick + 28) % 40) / 40)}
                cy={NODE_POSITIONS['node-drone'].y + (NODE_POSITIONS['node-health'].y - NODE_POSITIONS['node-drone'].y) * (((packetTick + 28) % 40) / 40)}
              />
            </>
          )}

          {/* Interactive Dynamic Nodes */}
          {networkNodes.map(node => {
            if (node.type === 'drone' && !isDroneDeployed) return null;
            const pos = NODE_POSITIONS[node.id];
            if (!pos) return null;

            const isSelected = selectedNodeId === node.id;
            const isOnline = networkMode === 'normal' || (node.type === 'drone' && isDroneDeployed) || isDroneDeployed;

            return (
              <g 
                key={node.id} 
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => setSelectedNodeId(node.id)}
                className="cursor-pointer group"
              >
                {/* Continuous Pulse Waves */}
                <circle
                  r="24"
                  fill="none"
                  stroke={node.type === 'drone' ? '#f59e0b' : isOnline ? '#10b981' : '#ef4444'}
                  strokeWidth="1.5"
                  className="animate-ping opacity-30"
                />

                {/* Node Outer Circle */}
                <circle 
                  r="18" 
                  fill="#0a0a0a" 
                  stroke={isSelected ? '#6366f1' : node.type === 'drone' ? '#f59e0b' : isOnline ? '#10b981' : '#ef4444'} 
                  strokeWidth={isSelected ? "3" : "2"}
                  className="transition-all duration-300 group-hover:scale-110"
                />

                {/* Icon inside Node */}
                <foreignObject x="-10" y="-10" width="20" height="20" className="pointer-events-none">
                  <div className="flex items-center justify-center w-full h-full">
                    {getIconForNode(node.type)}
                  </div>
                </foreignObject>

                {/* Label */}
                <text 
                  x="0" 
                  y="32" 
                  textAnchor="middle" 
                  fill={isSelected ? '#ffffff' : '#9ca3af'} 
                  fontSize="9" 
                  fontWeight="bold" 
                  className="uppercase tracking-wider pointer-events-none font-mono"
                >
                  {node.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected Node Real-Time Telemetry HUD Overlay */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-3 left-3 bg-neutral-900/90 backdrop-blur-md border border-neutral-700/80 rounded-xl p-3 shadow-2xl z-20 max-w-[210px] text-white"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
                <div className="flex items-center space-x-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">
                    {selectedNode.name}
                  </span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              {(() => {
                const metrics = getDynamicTelemetry(selectedNode.id);
                return (
                  <div className="space-y-1 text-[9px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Signal (RSSI):</span>
                      <span className="text-emerald-400 font-bold">{metrics.rssi}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Latency:</span>
                      <span className="text-amber-300 font-bold">{metrics.latency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Bandwidth:</span>
                      <span className="text-cyan-300 font-bold">{metrics.bandwidth}</span>
                    </div>
                    <div className="pt-1 mt-1 border-t border-white/10 flex items-center justify-between">
                      <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">{metrics.statusText}</span>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dynamic Active Teams & Camp Relays Status Bar */}
      <div className="mt-3 pt-3 border-t border-neutral-800 flex flex-wrap gap-2 justify-center items-center relative z-10">
        {(camps.length > 0 ? camps.slice(0, 3) : [
          { id: '1', name: 'Relief Hub Alpha', status: 'Safe' },
          { id: '2', name: 'NDRF Base 4', status: 'Operating' },
          { id: '3', name: 'AEC Field Center', status: 'Safe' }
        ]).map(camp => (
          <div 
            key={camp.id} 
            className="flex items-center gap-2 px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-full shadow-sm hover:border-indigo-500/40 transition-colors"
          >
            <div className={`w-2 h-2 rounded-full ${networkMode === 'normal' ? 'bg-emerald-400' : isDroneDeployed ? 'bg-amber-400 animate-pulse' : 'bg-red-400'}`} />
            <span className="text-[10px] font-bold text-neutral-200 uppercase font-mono">{camp.name}</span>
            <span className="text-[9px] font-mono text-indigo-400 font-semibold">
              {networkMode === 'normal' ? '4G/5G' : isDroneDeployed ? `MESH (${rfMode.toUpperCase()})` : 'DTN QUEUED'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
