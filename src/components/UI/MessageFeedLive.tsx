'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Zap, Activity, Clock, CheckCircle, Plane } from 'lucide-react';
import { PriorityMessage } from '@/lib/types';

const getPriorityStyle = (score: number) => {
  if (score >= 8) return {
    bg: 'bg-red-500/10 border-red-500/30',
    text: 'text-red-400',
    icon: <ShieldAlert className="w-4 h-4" />,
    label: 'CRITICAL'
  };
  if (score >= 5) return {
    bg: 'bg-amber-500/10 border-amber-500/30',
    text: 'text-amber-400',
    icon: <Zap className="w-4 h-4" />,
    label: 'HIGH'
  };
  return {
    bg: 'bg-neutral-800/50 border-white/5',
    text: 'text-neutral-400',
    icon: <Activity className="w-4 h-4" />,
    label: 'NORMAL'
  };
};

const getStatusDisplay = (msg: PriorityMessage) => {
  const scoreLabel = `[SCORE: ${msg.priorityScore}/10]`;
  
  switch (msg.status) {
    case 'queued':
    case 'delayed':
      return (
        <span className="flex items-center text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded text-[9px] font-black uppercase">
          <Clock className="w-3 h-3 mr-1 animate-pulse" /> {scoreLabel} QUEUED
        </span>
      );
    case 'hopping':
      return (
        <span className="flex items-center text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded text-[9px] font-black uppercase">
          <Plane className="w-3 h-3 mr-1 animate-pulse" /> {scoreLabel} MESH HOPPING
        </span>
      );
    case 'delivered':
      return (
        <span className="flex items-center text-green-400 bg-green-500/10 px-2 py-0.5 rounded text-[9px] font-black uppercase">
          <CheckCircle className="w-3 h-3 mr-1" /> {scoreLabel} DELIVERED
        </span>
      );
  }
};

export function MessageFeedLive() {
  const priorityMessages = useAppStore(state => state.priorityMessages);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top (since newest are at top usually in feeds, or bottom. Let's do top)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [priorityMessages.length]);

  return (
    <div className="glass-panel p-6 flex flex-col h-full border border-white/5 relative overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center">
          <Activity className="w-4 h-4 text-sapphire mr-2" />
          Live Priority Feed
        </h3>
        <span className="text-[10px] font-mono text-neutral-500">{priorityMessages.length} MSGS</span>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3"
      >
        <AnimatePresence>
          {priorityMessages.map((msg) => {
            const style = getPriorityStyle(msg.priorityScore);
            
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                layout
                className={`p-4 rounded-xl border ${style.bg} transition-colors`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`flex items-center space-x-1 text-[9px] font-black uppercase tracking-wider ${style.text}`}>
                      {style.icon}
                      <span>{style.label} (Score: {msg.priorityScore})</span>
                    </span>
                  </div>
                  {getStatusDisplay(msg)}
                </div>
                
                <p className="text-sm text-white font-medium mb-3 leading-relaxed">
                  {msg.content}
                </p>

                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  <span className="text-powder">{msg.senderRole} — {msg.sender}</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {priorityMessages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-neutral-500 opacity-50">
            <Activity className="w-8 h-8 mb-2" />
            <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Transmissions</p>
          </div>
        )}
      </div>
    </div>
  );
}
