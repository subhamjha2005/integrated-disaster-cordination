'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ReliefMap } from '@/components/Map/ReliefMap';
import { NetworkTopology } from '@/components/Network/NetworkTopology';
import { MessageFeedLive } from '@/components/UI/MessageFeedLive';
import { AlertTriangle, WifiOff, Plane, ShieldCheck, Send, Activity, Megaphone, Maximize2, Radio, Wifi, HeartPulse, ShieldAlert, Building2 } from 'lucide-react';
import { AgencyRole } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

import { fetchLocationNews, NewsArticle } from '@/lib/disasterApi';

export default function CommandCenter() {
  const { 
    networkMode, 
    isDroneDeployed,
    triggerInfrastructureFailure,
    restoreNetwork,
    deployDrone,
    recallDrone,
    sendPriorityMessage,
    alerts,
    incidentReports,
    rfMode,
    dronePowerMode,
    setRfMode,
    setDronePowerMode
  } = useAppStore();

  const [selectedRole, setSelectedRole] = useState<AgencyRole>('Health');
  const [worldMonitorNews, setWorldMonitorNews] = useState<NewsArticle[]>([]);
  const [newsCategory, setNewsCategory] = useState<'ALL' | 'INDIA' | 'FLOOD' | 'SEISMIC' | 'CYCLONE'>('ALL');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  // Fetch and auto-refresh live GDELT 2.0 & UN GDACS World Monitor disaster news every 60s
  useEffect(() => {
    let isMounted = true;
    async function loadWorldNews() {
      let q = 'disaster OR emergency OR flood OR earthquake OR cyclone';
      if (newsCategory === 'INDIA') q = 'India (disaster OR flood OR earthquake OR NDRF OR IMD)';
      else if (newsCategory === 'FLOOD') q = 'flood OR inundation OR river';
      else if (newsCategory === 'SEISMIC') q = 'earthquake OR aftershock OR seismic';
      else if (newsCategory === 'CYCLONE') q = 'cyclone OR typhoon OR storm';

      const news = await fetchLocationNews(q);
      if (isMounted && news && news.length > 0) {
        setWorldMonitorNews(news);
      }
    }
    loadWorldNews();
    const interval = setInterval(loadWorldNews, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [newsCategory]);

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

  // Combine real store alerts and incident reports dynamically
  const activeIncidents = [
    ...alerts.map(a => ({
      id: a.id,
      title: a.message,
      location: a.relatedCampId ? `Camp ${a.relatedCampId}` : 'Sector Hub',
      timeAgo: 'Live',
      severity: a.type
    })),
    ...incidentReports.map(r => ({
      id: r.id,
      title: `${r.type}: ${r.description}`,
      location: `Lat ${r.location.lat.toFixed(2)}, Lng ${r.location.lng.toFixed(2)}`,
      timeAgo: r.timestamp ? 'Recent' : 'Just now',
      severity: r.intensity > 0.7 || r.type === 'Medical' ? 'Critical' : 'High'
    }))
  ].slice(0, 5);

  const renderMapContent = () => (
    <div className="flex-1 w-full h-full relative overflow-hidden flex flex-col">
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <span className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-black text-white uppercase tracking-widest shadow-lg">
          Tactical Map View
        </span>
        {isDroneDeployed && (
          <span className="bg-emerald-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-emerald-500/30 text-[10px] font-black text-emerald-400 uppercase tracking-widest shadow-lg">
            RF Link Locked
          </span>
        )}
      </div>

      {/* Fullscreen Map Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => window.open('/map-fullscreen', '_blank')}
          title="Fullscreen Map"
          className="bg-black/80 hover:bg-neutral-900 border border-white/20 text-white p-2.5 rounded-xl transition-all backdrop-blur-md shadow-xl flex items-center gap-1.5 text-xs font-black uppercase tracking-wider cursor-pointer"
        >
          <Maximize2 className="w-4 h-4 text-cyan-400" />
          <span>Fullscreen Map</span>
        </button>
      </div>

      <div className="flex-1 w-full relative bg-navy overflow-hidden">
        <ReliefMap rawContainer />
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-6rem)] flex flex-col gap-6 pb-24">
        
        {/* Top Control Bar */}
        <div className="glass-panel p-4 flex flex-wrap justify-between items-center gap-4 border border-white/5 shadow-lg shrink-0 z-20 relative">
          <div className="flex items-center space-x-4 flex-wrap gap-2">
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
                {networkMode === 'normal' ? 'Network: Nominal' : 'Network: DEGRADED (FALLBACK ACTIVE)'}
              </span>
            </div>

            {isDroneDeployed && (
              <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-emerald-400 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>RF: {rfMode === 'lora' ? '915MHz Sub-GHz' : '1.4GHz COFDM'} ({dronePowerMode === 'tethered' ? 'Tethered 24h' : 'Battery Swarm'})</span>
              </div>
            )}
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
          <div className="lg:col-span-7 min-h-[440px] flex flex-col glass-panel rounded-3xl overflow-hidden border border-white/5 relative shadow-2xl">
            {renderMapContent()}
          </div>

          {/* Right: Topology & Feed */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Topology Graph */}
            <div className="h-[350px] shrink-0">
              <NetworkTopology />
            </div>

            {/* Active Incidents Mini-Panel */}
            <div className="glass-panel p-4 rounded-xl border border-white/10 shrink-0">
              <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3 text-rose-500" /> Active Emergency Incidents
                </span>
                <span className="text-[9px] text-emerald-400 font-mono">Live Sync</span>
              </h3>
              <div className="space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar pr-2">
                {activeIncidents.map(incident => (
                  <div key={incident.id} className="flex items-start gap-3 p-2 bg-white/5 rounded-lg border border-white/5">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${incident.severity === 'Critical' ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'}`} />
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-white leading-tight truncate">{incident.title}</p>
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

        {/* Live Inter-Agency Communications Matrix & World Monitor Intel Ticker */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 relative z-20">
          
          {/* Left: Inter-Agency Status Matrix */}
          <div className="md:col-span-7 glass-panel p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Inter-Agency Response Network Matrix
              </h3>
              <span className="text-[9px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                P2P Mesh + Drone Fallback
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { agency: 'Health Teams', icon: HeartPulse, weight: '10', status: networkMode === 'normal' ? 'Cellular' : 'Drone Mesh', color: 'text-emerald-400' },
                { agency: 'NDRF Squads', icon: ShieldAlert, weight: '9', status: networkMode === 'normal' ? 'Cellular' : 'LoRa P2P', color: 'text-amber-400' },
                { agency: 'Local Admin', icon: Activity, weight: '8', status: networkMode === 'normal' ? 'Cellular' : 'Satellite', color: 'text-blue-400' },
                { agency: 'Police Force', icon: Radio, weight: '6', status: networkMode === 'normal' ? 'Cellular' : 'BLE Mesh', color: 'text-indigo-400' },
              ].map((team, idx) => {
                const IconComp = team.icon;
                return (
                  <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-1">
                      <IconComp className={`w-4 h-4 ${team.color}`} />
                      <span className="text-[8px] font-mono text-neutral-400 bg-white/10 px-1.5 py-0.5 rounded">W: {team.weight}</span>
                    </div>
                  <p className="text-[11px] font-bold text-white truncate">{team.agency}</p>
                  <p className="text-[9px] font-mono text-emerald-400 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {team.status}
                  </p>
                </div>
                );
              })}
            </div>
          </div>

          {/* Right: Live World Monitor Intel Feed */}
          <div className="md:col-span-5 glass-panel p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
            <div className="flex flex-col gap-2 border-b border-white/10 pb-2 mb-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-amber-400" />
                  Live Disaster Intel Feed
                </h3>
                <span className="text-[9px] font-mono text-amber-400 animate-pulse">WORLD MONITOR LIVE</span>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-1">
                {(['ALL', 'INDIA', 'FLOOD', 'SEISMIC', 'CYCLONE'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setNewsCategory(cat)}
                    className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      newsCategory === cat 
                        ? 'bg-amber-500 text-black shadow-md' 
                        : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white border border-white/5'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[160px] custom-scrollbar pr-1">
              {worldMonitorNews.length > 0 ? (
                worldMonitorNews.map((news, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedArticle(news)}
                    className="w-full text-left flex items-center justify-between text-[10px] bg-white/5 hover:bg-white/10 p-2 rounded-xl border border-white/5 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span className="font-mono text-neutral-400 shrink-0 text-[8.5px]">{news.seendate}</span>
                      <span className="font-bold text-amber-400 shrink-0 text-[9px]">[{news.source}]</span>
                      <span className="text-white font-medium truncate group-hover:text-amber-300">{news.title}</span>
                    </div>
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 ml-2">
                      INTEL
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-3 text-center text-neutral-400 text-xs italic">
                  Connecting to GDELT 2.0 & UN GDACS Live Feed...
                </div>
              )}
            </div>
          </div>

          {/* World Monitor Intel Briefing Modal */}
          <AnimatePresence>
            {selectedArticle && (
              <div className="fixed inset-0 z-[9999999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 max-w-lg w-full text-white shadow-2xl space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center space-x-2">
                      <Megaphone className="w-5 h-5 text-amber-400 animate-pulse" />
                      <h3 className="text-sm font-black uppercase tracking-wider text-amber-400">World Monitor Intel Briefing</h3>
                    </div>
                    <button onClick={() => setSelectedArticle(null)} className="p-1 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white">
                      ✕
                    </button>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                      SOURCE: {selectedArticle.source} • {selectedArticle.seendate}
                    </span>
                    <h4 className="text-base font-bold text-white leading-snug">{selectedArticle.title}</h4>
                    <p className="text-xs text-neutral-400 leading-relaxed italic">
                      Real-time disaster telemetry captured via GDELT 2.0 & UN GDACS global surveillance feeds.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <a
                      href={selectedArticle.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-widest rounded-xl text-center transition-all shadow-lg shadow-amber-500/20"
                    >
                      Read Full Article →
                    </a>
                    <button
                      onClick={() => setSelectedArticle(null)}
                      className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold uppercase rounded-xl"
                    >
                      Close Briefing
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

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
