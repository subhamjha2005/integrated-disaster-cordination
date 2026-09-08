'use client';

import { useState } from 'react';
import { CommMedium } from '@/lib/types';
import { COMM_MEDIUMS, MediumSpec } from '@/lib/commProtocols';
import { Wifi, Radio, Globe, Info, X, Shield, ArrowRight, Activity, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MediumSelectorProps {
  selectedMedium: CommMedium;
  onSelectMedium: (medium: CommMedium) => void;
}

export function MediumSelector({ selectedMedium, onSelectMedium }: MediumSelectorProps) {
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [inspectedMedium, setInspectedMedium] = useState<CommMedium>(selectedMedium);

  const currentSpec = COMM_MEDIUMS[selectedMedium];
  const guideSpec = COMM_MEDIUMS[inspectedMedium];

  const handleOpenGuide = (medium: CommMedium) => {
    setInspectedMedium(medium);
    setShowGuideModal(true);
  };

  return (
    <>
      {/* Top Banner Selector Bar */}
      <div className="px-4 py-2 bg-black/60 backdrop-blur-md border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Medium Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mr-1 flex items-center gap-1">
            <Radio className="w-3 h-3 text-neutral-400 animate-pulse" />
            Bearer:
          </span>

          {(Object.keys(COMM_MEDIUMS) as CommMedium[]).map((medKey) => {
            const spec = COMM_MEDIUMS[medKey];
            const isSelected = selectedMedium === medKey;

            return (
              <button
                key={medKey}
                onClick={() => onSelectMedium(medKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isSelected
                    ? 'bg-white/15 text-white border-white/30 shadow-[0_0_12px_rgba(255,255,255,0.15)]'
                    : 'bg-white/5 text-neutral-400 border-white/5 hover:bg-white/10 hover:text-white'
                }`}
                style={{
                  borderColor: isSelected ? spec.color : undefined,
                  boxShadow: isSelected ? `0 0 14px ${spec.bgGlow}` : undefined,
                }}
              >
                <span>{spec.icon}</span>
                <span className="uppercase text-[10px] tracking-wider">{spec.badge}</span>
                {isSelected && (
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-ping"
                    style={{ backgroundColor: spec.color }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Operational Guide Button */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-neutral-400 hidden sm:inline">
            Range: <strong className="text-white">{currentSpec.physicalRange.split('(')[0]}</strong>
          </span>

          <button
            onClick={() => handleOpenGuide(selectedMedium)}
            className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            <span>How It Works & Guide</span>
          </button>
        </div>
      </div>

      {/* Interactive Modal Guide */}
      <AnimatePresence>
        {showGuideModal && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-neutral-950 border border-white/15 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 text-white max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border"
                    style={{
                      backgroundColor: `${guideSpec.color}15`,
                      borderColor: guideSpec.color,
                      boxShadow: `0 0 20px ${guideSpec.bgGlow}`
                    }}
                  >
                    {guideSpec.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black uppercase tracking-wider text-white">
                        {guideSpec.name}
                      </h3>
                      <span
                        className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border"
                        style={{
                          color: guideSpec.color,
                          borderColor: guideSpec.color,
                          backgroundColor: `${guideSpec.color}10`
                        }}
                      >
                        {guideSpec.badge}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">{guideSpec.requirement}</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowGuideModal(false)}
                  className="p-1.5 hover:bg-white/10 rounded-xl text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tab Selector Inside Modal to Switch and Compare Mediums */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
                {(Object.keys(COMM_MEDIUMS) as CommMedium[]).map((med) => {
                  const s = COMM_MEDIUMS[med];
                  const isCurrent = inspectedMedium === med;
                  return (
                    <button
                      key={med}
                      onClick={() => setInspectedMedium(med)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isCurrent
                          ? 'bg-white/15 text-white shadow-md border border-white/20'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span>{s.icon}</span>
                      <span className="truncate">{s.badge}</span>
                    </button>
                  );
                })}
              </div>

              {/* Spec Matrix Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                  <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400 block mb-1">Radio Freq</span>
                  <span className="text-xs font-bold text-white font-mono">{guideSpec.frequency}</span>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                  <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400 block mb-1">Effective Range</span>
                  <span className="text-xs font-bold text-emerald-400 font-mono">{guideSpec.physicalRange}</span>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                  <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400 block mb-1">Latency</span>
                  <span className="text-xs font-bold text-cyan-300 font-mono">{guideSpec.typicalLatency}</span>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                  <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400 block mb-1">Security</span>
                  <span className="text-xs font-bold text-amber-300 font-mono truncate block">{guideSpec.encryption}</span>
                </div>
              </div>

              {/* Step 1: How You (The Sender) Transmit */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  1. How You (Sender) Transmit
                </h4>
                <div className="space-y-2">
                  {guideSpec.howToUse.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                      <div className="w-5 h-5 rounded-full bg-white/10 text-white font-mono text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{step.stepTitle}</p>
                        <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 2: How The Recipient Receives */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  2. How The Recipient (Police / Hospital / Camp) Receives
                </h4>
                <div className="bg-indigo-950/40 border border-indigo-500/30 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300">
                      Destination Target: {guideSpec.howRecipientReceives.receiverType}
                    </span>
                    <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded-full">
                      Radius: {guideSpec.howRecipientReceives.coverageRadius}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    {guideSpec.howRecipientReceives.mechanism}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 flex justify-between items-center border-t border-white/10">
                <button
                  onClick={() => {
                    onSelectMedium(inspectedMedium);
                    setShowGuideModal(false);
                  }}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center gap-2 cursor-pointer"
                >
                  <span>Select & Activate {guideSpec.badge}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setShowGuideModal(false)}
                  className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer"
                >
                  Close Guide
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
