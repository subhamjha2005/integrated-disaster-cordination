'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { useAppStore } from '@/store/useAppStore';
import {
  Navigation,
  MapPin,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  AlertTriangle,
  Radio,
  Wifi,
  WifiOff,
  Shield,
  ArrowRight,
  RefreshCw,
  PhoneCall,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function VolunteerRoutePage() {
  const { volunteers, tasks, camps, networkMode } = useAppStore();
  const currentVolunteer = volunteers[volunteers.length - 1] || {
    id: 'vol-active',
    name: 'Volunteer Responder',
    skills: ['Logistics', 'First Aid'],
    status: 'Deployed'
  };

  const [currentStep, setCurrentStep] = useState<number>(2); // 0: Assigned, 1: Picked Up, 2: In Transit, 3: Completed
  const [offlineSyncLogged, setOfflineSyncLogged] = useState(false);
  const [sosTriggered, setSosTriggered] = useState(false);

  const activeCamp = camps[0] || {
    name: 'Sarusajai Regional Relief Hub',
    address: 'Sarusajai Sports Complex, Guwahati, Assam',
    contactPhone: '0361-222-1111',
    status: 'Operating'
  };

  const steps = [
    { title: 'Task Dispatched', desc: 'Assigned by Strategic Command Alpha', time: '10:15 AM', done: currentStep >= 0 },
    { title: 'Supplies Secured', desc: '20x Water Purification & First Aid Kits verified', time: '10:30 AM', done: currentStep >= 1 },
    { title: 'Corridor Transit', desc: 'En route via NH-27 bypass (Safe elevation corridor)', time: 'In Progress', done: currentStep >= 2 },
    { title: 'Final Handover', desc: 'Relief Hub logistics coordinator signature', time: 'Est. 11:20 AM', done: currentStep >= 3 },
  ];

  const handleAdvanceStep = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-6rem)] space-y-6 pb-20">
        
        {/* Top Header Card */}
        <div className="glass-panel p-6 border border-white/10 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                ACTIVE FIELD DISPATCH ROUTE #DIS-892
              </span>
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
              <Truck className="w-6 h-6 text-powder" />
              Volunteer Navigation & Dispatch Corridors
            </h1>
            <p className="text-xs text-neutral-400 font-medium mt-1">
              Live transit telemetry • Assigned Responder: <strong className="text-white">{currentVolunteer.name}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-2 ${
              networkMode === 'normal' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}>
              {networkMode === 'normal' ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span>{networkMode === 'normal' ? 'GPS / LTE Connected' : 'DTN Mesh Fallback (915MHz)'}</span>
            </div>

            <button
              onClick={() => setSosTriggered(!sosTriggered)}
              className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                sosTriggered 
                  ? 'bg-red-600 text-white shadow-[0_0_25px_rgba(220,38,38,0.8)] animate-pulse' 
                  : 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              {sosTriggered ? 'SOS BROADCAST ACTIVE' : 'Emergency Beacon'}
            </button>
          </div>
        </div>

        {/* Main Grid: Corridor Details + Progress Stepper */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Route Stepper & Active Leg */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Active Leg HUD */}
            <div className="glass-panel p-6 border border-white/10 rounded-3xl space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-0.5">CURRENT NAVIGATION LEG</span>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">
                    {currentStep === 0 && 'Depot Mobilization & Staging'}
                    {currentStep === 1 && 'Payload Verification & Packaging'}
                    {currentStep === 2 && 'In-Transit: NH-27 Elevated Bypass'}
                    {currentStep === 3 && 'Arrived: Handover in Progress'}
                  </h3>
                </div>
                <span className="text-sm font-mono font-bold bg-powder/20 text-powder border border-powder/40 px-3 py-1 rounded-xl">
                  ETA: 18 MIN
                </span>
              </div>

              {/* Checkpoint Stepper */}
              <div className="space-y-4">
                {steps.map((step, idx) => (
                  <div 
                    key={step.title}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                      idx === currentStep
                        ? 'bg-powder/10 border-powder/50 shadow-[0_0_20px_rgba(56,189,248,0.15)]'
                        : idx < currentStep
                        ? 'bg-emerald-500/5 border-emerald-500/20 opacity-80'
                        : 'bg-white/5 border-white/5 opacity-40'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                        idx < currentStep 
                          ? 'bg-emerald-500 text-black' 
                          : idx === currentStep 
                          ? 'bg-powder text-black animate-pulse' 
                          : 'bg-neutral-800 text-neutral-400'
                      }`}>
                        {idx < currentStep ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-wider">{step.title}</h4>
                        <p className="text-[11px] text-neutral-400 mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400 font-bold shrink-0">{step.time}</span>
                  </div>
                ))}
              </div>

              {/* Control Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={handleAdvanceStep}
                  disabled={currentStep >= 3}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{currentStep >= 3 ? 'Route Completed' : 'Confirm Checkpoint Progress'}</span>
                </button>

                <button
                  onClick={() => {
                    setOfflineSyncLogged(true);
                    setTimeout(() => setOfflineSyncLogged(false), 3000);
                  }}
                  className="px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold uppercase rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${offlineSyncLogged ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>{offlineSyncLogged ? 'Queued to DTN' : 'Log Offline Waypoint'}</span>
                </button>
              </div>
            </div>

            {/* Road Hazards & Dynamic Detours */}
            <div className="glass-panel p-6 border border-white/10 rounded-3xl space-y-4">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Live Route Hazards & Advisory
              </h3>
              <div className="space-y-2.5">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1"></div>
                  <div>
                    <strong className="text-amber-300 font-bold">Jalukbari Circle:</strong>
                    <span className="text-neutral-300 ml-1">Knee-deep waterlogging detected. Divert through the elevated flyover ramp.</span>
                  </div>
                </div>

                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-400 shrink-0 mt-1"></div>
                  <div>
                    <strong className="text-red-300 font-bold">AEC Hostel 4 Corridor:</strong>
                    <span className="text-neutral-300 ml-1">Downed power lines reported. Ground clearance is currently 0m; road barricaded.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Destination Hub & Quick Dispatches */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Target Hub Card */}
            <div className="glass-panel p-6 border border-white/10 rounded-3xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-powder" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Target Delivery Hub</span>
                </div>
                <span className="text-[9px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  {activeCamp.status}
                </span>
              </div>

              <div>
                <h4 className="text-base font-black text-white">{activeCamp.name}</h4>
                <p className="text-xs text-neutral-400 mt-1">{activeCamp.address}</p>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400">Urgent Requisition:</span>
                  <span className="text-white font-bold font-mono">20x Emergency MREs</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400">Hub Coordinator:</span>
                  <span className="text-white font-bold font-mono">NDRF Field Duty Officer</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400">Emergency Phone:</span>
                  <span className="text-powder font-bold font-mono">{activeCamp.contactPhone}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <a
                  href={`tel:${activeCamp.contactPhone}`}
                  className="flex-1 py-2.5 bg-powder/10 hover:bg-powder/20 border border-powder/30 rounded-xl text-xs font-bold text-powder uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call Hub</span>
                </a>

                <Link
                  href="/camps"
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2 transition-colors"
                >
                  <span>View All Camps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Quick Navigation Links */}
            <div className="glass-panel p-6 border border-white/10 rounded-3xl space-y-3">
              <h3 className="text-xs font-black text-white uppercase tracking-widest">Tactical Shortcuts</h3>
              
              <Link
                href="/volunteers"
                className="flex items-center justify-between p-3.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 rounded-2xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Volunteer Deployment Grid</span>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
              </Link>

              <Link
                href="/chat"
                className="flex items-center justify-between p-3.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 rounded-2xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white">Secure Relay Mesh Chat</span>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
              </Link>

              <Link
                href="/"
                className="flex items-center justify-between p-3.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 rounded-2xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Navigation className="w-4 h-4 text-powder" />
                  <span className="text-xs font-bold text-white">Live Orbital & Tactical Map</span>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
              </Link>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
