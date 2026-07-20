'use client';

import { useAppStore } from '@/store/useAppStore';
import { motion } from 'framer-motion';
import { NetworkNode } from '@/lib/types';
import { Radio, ShieldAlert, HeartPulse, Plane } from 'lucide-react';

// Hardcoded positions for the 4 nodes in the SVG viewbox (0 0 400 300)
const NODE_POSITIONS: Record<string, { x: number, y: number }> = {
  'node-gateway': { x: 200, y: 50 },
  'node-police': { x: 80, y: 220 },
  'node-health': { x: 320, y: 220 },
  'node-drone': { x: 200, y: 150 },
};

const getIconForNode = (type: string) => {
  switch (type) {
    case 'gateway': return <Radio className="w-5 h-5" />;
    case 'field': return <HeartPulse className="w-5 h-5" />;
    case 'drone': return <Plane className="w-5 h-5" />;
    default: return <ShieldAlert className="w-5 h-5" />;
  }
};

const getColorForStatus = (status: string, isDroneDeployed?: boolean) => {
  if (status === 'online') return '#4ade80'; // Green
  if (status === 'mesh' || isDroneDeployed) return '#facc15'; // Yellow
  return '#f87171'; // Red
};

export function NetworkTopology() {
  const { networkNodes, networkMode, isDroneDeployed } = useAppStore();

  const gateway = networkNodes.find(n => n.type === 'gateway');
  const police = networkNodes.find(n => n.id === 'node-police');
  const health = networkNodes.find(n => n.id === 'node-health');
  const drone = networkNodes.find(n => n.type === 'drone');

  return (
    <div className="glass-panel p-6 w-full h-full flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-center mb-4 relative z-10">
        <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center">
          <Radio className="w-4 h-4 text-sapphire mr-2" />
          Network Topology
        </h3>
        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded ${
          networkMode === 'normal' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400 animate-pulse'
        }`}>
          {networkMode === 'normal' ? 'Uplink Active' : 'SATELLITE FALLBACK'}
        </span>
      </div>

      <div className="flex-1 relative w-full h-full min-h-[250px]">
        <svg viewBox="0 0 400 300" className="w-full h-full absolute inset-0 drop-shadow-2xl">
          {/* Defs for animations */}
          <defs>
            <linearGradient id="meshGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#facc15" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#facc15" stopOpacity="1" />
              <stop offset="100%" stopColor="#facc15" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Lines connecting nodes */}
          {gateway && police && (
            <motion.line
              x1={NODE_POSITIONS[gateway.id].x} y1={NODE_POSITIONS[gateway.id].y}
              x2={NODE_POSITIONS[police.id].x} y2={NODE_POSITIONS[police.id].y}
              stroke={networkMode === 'normal' ? '#4ade80' : '#f87171'}
              strokeWidth="2"
              strokeDasharray={networkMode === 'normal' ? 'none' : '5,5'}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1 }}
            />
          )}

          {gateway && health && (
            <motion.line
              x1={NODE_POSITIONS[gateway.id].x} y1={NODE_POSITIONS[gateway.id].y}
              x2={NODE_POSITIONS[health.id].x} y2={NODE_POSITIONS[health.id].y}
              stroke={networkMode === 'normal' ? '#4ade80' : '#f87171'}
              strokeWidth="2"
              strokeDasharray={networkMode === 'normal' ? 'none' : '5,5'}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1 }}
            />
          )}

          {/* Drone Mesh Links (Only visible when deployed) */}
          {isDroneDeployed && gateway && police && health && drone && (
            <>
              {/* Drone to Gateway */}
              <motion.line
                x1={NODE_POSITIONS[drone.id].x} y1={NODE_POSITIONS[drone.id].y}
                x2={NODE_POSITIONS[gateway.id].x} y2={NODE_POSITIONS[gateway.id].y}
                stroke="url(#meshGradient)"
                strokeWidth="2"
                strokeDasharray="8,8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              />
              {/* Drone to Police */}
              <motion.line
                x1={NODE_POSITIONS[drone.id].x} y1={NODE_POSITIONS[drone.id].y}
                x2={NODE_POSITIONS[police.id].x} y2={NODE_POSITIONS[police.id].y}
                stroke="url(#meshGradient)"
                strokeWidth="2"
                strokeDasharray="8,8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              />
              {/* Drone to Health */}
              <motion.line
                x1={NODE_POSITIONS[drone.id].x} y1={NODE_POSITIONS[drone.id].y}
                x2={NODE_POSITIONS[health.id].x} y2={NODE_POSITIONS[health.id].y}
                stroke="url(#meshGradient)"
                strokeWidth="2"
                strokeDasharray="8,8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              />
            </>
          )}

          {/* Render Nodes */}
          {networkNodes.map(node => {
            // Hide drone if not deployed
            if (node.type === 'drone' && !isDroneDeployed) return null;
            
            const pos = NODE_POSITIONS[node.id];
            if (!pos) return null;

            const color = getColorForStatus(node.status, node.type === 'drone' && isDroneDeployed);

            return (
              <g key={node.id} transform={`translate(${pos.x}, ${pos.y})`}>
                {/* Ping animation for active nodes */}
                {node.status === 'online' && (
                  <motion.circle
                    r="25"
                    fill="none"
                    stroke={color}
                    strokeWidth="1"
                    initial={{ scale: 0.8, opacity: 0.8 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                )}
                
                <circle r="20" fill="#0f172a" stroke={color} strokeWidth="3" />
                <foreignObject x="-10" y="-10" width="20" height="20">
                  <div className="flex items-center justify-center w-full h-full text-white" style={{ color }}>
                    {getIconForNode(node.type)}
                  </div>
                </foreignObject>
                <text x="0" y="35" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold" className="uppercase tracking-widest">
                  {node.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Connected Teams Status Badge */}
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2 justify-center z-10 pointer-events-none">
          {['Health Team Alpha', 'NDRF Unit 4', 'Police Sector 2'].map(team => (
            <div key={team} className="flex items-center gap-2 px-3 py-1.5 bg-black/80 backdrop-blur-md rounded-full border border-white/10 shadow-lg">
              <div className={`w-2 h-2 rounded-full ${networkMode === 'normal' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              <span className="text-[10px] font-bold text-neutral-300 uppercase">{team}</span>
              <span className={`text-[9px] font-black uppercase ${networkMode === 'normal' ? 'text-neutral-500' : 'text-amber-400'}`}>
                {networkMode === 'normal' ? '4G/5G' : 'VIA MESH'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
