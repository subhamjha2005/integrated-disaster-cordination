'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ReliefMap } from '@/components/Map/ReliefMap';
import { NetworkTopology } from '@/components/Network/NetworkTopology';
import { MessageFeedLive } from '@/components/UI/MessageFeedLive';
import { AlertTriangle, WifiOff, Plane, ShieldCheck, Send, Activity } from 'lucide-react';
import { AgencyRole } from '@/lib/types';
import { motion } from 'framer-motion';

export default function CommandCenter() {
  const { 
    networkMode, 
    isDroneDeployed,
    triggerInfrastructureFailure,
    restoreNetwork,
    deployDrone,
    recallDrone,
    sendPriorityMessage 
  } = useAppStore();

  const [selectedRole, setSelectedRole] = useState<AgencyRole>('Health');

  const demoMessages = [
    { text: "Cardiac arrest at Sector 4, need immediate medevac.", urgency: 5 },
    { text: "NDRF Squad B requesting heavy lifting equipment.", urgency: 4 },
    { text: "Food rations running low at Main Hub.", urgency: 2 },
    { text: "Daily status report: 450 civilians processed.", urgency: 1 },
  ];

  const handleSend = (text: string, urgency: number) => {
    sendPriorityMessage({
      sender: 'Operator Alpha',
      senderRole: selectedRole,
      urgencyLevel: urgency,
      content: text,
      location: { lat: 26.1859, lng: 91.7477 },
      proximityScore: 8 // High proximity for demo
    });
  };

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-6rem)] flex flex-col gap-6 pb-24">
        
        {/* Top Control Bar */}
        <div className="glass-panel p-4 flex flex-wrap justify-between items-center gap-4 border border-white/5 shadow-lg shrink-0 z-20 relative">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-black uppercase tracking-tight text-white flex items-center">
              <ShieldCheck className="w-6 h-6 text-sapphire mr-3" />
              Strategic Command
            </h1>
            
            <div className={`px-4 py-2 rounded-xl flex items-center space-x-2 border ${
              networkMode === 'normal' 
                ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                : 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
            }`}>
              {networkMode === 'normal' ? <Activity className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
              <span className="text-xs font-black uppercase tracking-widest">
                {networkMode === 'normal' ? 'Network: Nominal' : 'Network: DEGRADED (SATELLITE ONLY)'}
              </span>
            </div>
          </div>

          <div className="flex space-x-3">
            {networkMode === 'normal' ? (
              <button 
                onClick={triggerInfrastructureFailure}
                className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-colors shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Simulate Infrastructure Failure
              </button>
            ) : (
              <>
                <button 
                  onClick={restoreNetwork}
                  className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-colors flex items-center"
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Restore Primary Network
                </button>
                
                {!isDroneDeployed && (
                  <button 
                    onClick={deployDrone}
                    className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-black uppercase tracking-widest rounded-xl transition-colors shadow-[0_0_20px_rgba(234,179,8,0.4)] flex items-center"
                  >
                    <Plane className="w-4 h-4 mr-2" />
                    Deploy Drone Relay
                  </button>
                )}
                {isDroneDeployed && (
                  <button 
                    onClick={recallDrone}
                    className="px-6 py-2 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-colors flex items-center"
                  >
                    Recall Drone
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Main Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
          
          {/* Left: Map & Drone View */}
          <div className="lg:col-span-7 flex flex-col glass-panel rounded-3xl overflow-hidden border border-white/5 relative shadow-2xl min-h-[400px]">
            <div className="absolute top-4 left-4 z-10">
              <span className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-black text-white uppercase tracking-widest shadow-lg">
                Tactical Map View
              </span>
            </div>
            <div className="flex-1 w-full bg-navy relative min-h-[400px]">
              <ReliefMap />
            </div>
          </div>

          {/* Right: Topology & Feed */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Topology Graph */}
            <div className="h-[350px] shrink-0">
              <NetworkTopology />
            </div>

            {/* Active Incidents Mini-Panel */}
            <div className="glass-panel p-4 rounded-xl border border-white/10 shrink-0">
              <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <AlertTriangle className="w-3 h-3 text-rose-500" /> Active Incidents
              </h3>
              <div className="space-y-2 max-h-[120px] overflow-y-auto custom-scrollbar pr-2">
                {[
                  { id: 1, title: 'Bridge Collapse', location: 'Sector 4', timeAgo: '2m ago', severity: 'Critical' },
                  { id: 2, title: 'Power Grid Failure', location: 'Main Hub', timeAgo: '15m ago', severity: 'High' }
                ].map(incident => (
                  <div key={incident.id} className="flex items-start gap-3 p-2 bg-white/5 rounded-lg border border-white/5">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${incident.severity === 'Critical' ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'}`} />
                    <div>
                      <p className="text-xs font-bold text-white leading-tight">{incident.title}</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">{incident.location} • {incident.timeAgo}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Message Feed */}
            <div className="flex-1 min-h-[300px]">
              <MessageFeedLive />
            </div>

          </div>
        </div>

        {/* Bottom Panel: Quick Send Demo Panel */}
        <div className="w-full mt-auto relative z-20">
          <div className="glass-panel p-4 flex flex-col md:flex-row items-center gap-4 border border-sapphire/30 shadow-[0_0_30px_rgba(99,102,241,0.2)] bg-navy-panel/90 backdrop-blur-xl">
            
            <div className="flex items-center space-x-3 shrink-0">
              <span className="text-[10px] font-black text-powder uppercase tracking-widest">Act As:</span>
              <select 
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as AgencyRole)}
                className="bg-black/50 border border-white/10 text-white text-xs font-bold rounded-lg px-3 py-2 outline-none focus:border-sapphire transition-colors"
              >
                <option value="Health">Health (Weight: 10)</option>
                <option value="NDRF">NDRF (Weight: 9)</option>
                <option value="LocalAdmin">Local Admin (Weight: 8)</option>
                <option value="Police">Police (Weight: 6)</option>
                <option value="Public">Public (Weight: 2)</option>
              </select>
            </div>

            <div className="flex-1 flex gap-2 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
              {demoMessages.map((msg, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(msg.text, msg.urgency)}
                  className="shrink-0 px-4 py-2 bg-white/5 hover:bg-sapphire/20 border border-white/10 hover:border-sapphire/50 text-left rounded-xl transition-all group flex items-center"
                >
                  <Send className="w-3 h-3 text-neutral-500 group-hover:text-sapphire mr-2" />
                  <div>
                    <p className="text-xs text-white font-medium truncate max-w-[150px]">{msg.text}</p>
                    <p className="text-[9px] text-neutral-500 uppercase font-black">Urgency: {msg.urgency}/5</p>
                  </div>
                </button>
              ))}
            </div>

          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
