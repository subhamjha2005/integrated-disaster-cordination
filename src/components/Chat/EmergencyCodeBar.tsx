'use client';

import { EMERGENCY_CODES, EmergencyCode } from '@/lib/commProtocols';
import { ShieldAlert, Info } from 'lucide-react';

interface EmergencyCodeBarProps {
  onSelectCode: (code: string) => void;
  activeCode: string | null;
}

export function EmergencyCodeBar({ onSelectCode, activeCode }: EmergencyCodeBarProps) {
  return (
    <div className="px-4 py-2 bg-black/40 border-b border-white/5 flex items-center justify-between gap-3 overflow-x-auto custom-scrollbar">
      <div className="flex items-center gap-2 shrink-0">
        <ShieldAlert className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
        <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
          Emergency Agency Codes:
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        {Object.values(EMERGENCY_CODES).map((item) => {
          const isSelected = activeCode === item.code;

          return (
            <button
              key={item.code}
              onClick={() => onSelectCode(item.code)}
              title={`${item.title} — ${item.description}`}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                isSelected
                  ? 'bg-rose-500/20 text-white border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                  : 'bg-white/5 text-neutral-300 border-white/10 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <span>{item.icon}</span>
              <span className="font-black text-rose-400">[{item.code}]</span>
              <span className="text-[10px] text-neutral-300 hidden md:inline truncate max-w-[120px]">
                {item.title.split('/')[0].trim()}
              </span>
            </button>
          );
        })}
      </div>

      <div className="hidden lg:flex items-center gap-1 text-[9px] text-neutral-500 font-mono shrink-0">
        <Info className="w-3 h-3 text-neutral-400" />
        <span>Type or click code to alert station</span>
      </div>
    </div>
  );
}
