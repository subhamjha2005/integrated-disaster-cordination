'use client';

import { ChatChannel } from '@/lib/types';
import { Radio, MapPin, Tent, Zap, ShieldAlert, Building2, Flame, HeartPulse } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getTranslation } from '@/lib/translations';

interface ChannelListProps {
  channels: ChatChannel[];
  activeChannelId: string;
  onSelectChannel: (channelId: string) => void;
  isConnected: boolean;
}

export function ChannelList({ channels, activeChannelId, onSelectChannel, isConnected }: ChannelListProps) {
  const { language } = useAppStore();
  const t = (key: any) => getTranslation(language, key);

  const agencyChannels = channels.filter((c) => c.type === 'agency');
  const emergencyChannels = channels.filter((c) => c.type === 'emergency');
  const locationChannels = channels.filter((c) => c.type === 'location');
  const campChannels = channels.filter((c) => c.type === 'camp');

  const iconForType = (ch: ChatChannel) => {
    if (ch.type === 'agency') {
      if (ch.id.includes('health') || ch.code === '102') return <HeartPulse className="w-3.5 h-3.5 text-rose-400" />;
      if (ch.id.includes('police') || ch.code === '100') return <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />;
      if (ch.id.includes('fire') || ch.code === '101') return <Flame className="w-3.5 h-3.5 text-orange-400" />;
      return <Building2 className="w-3.5 h-3.5 text-amber-400" />;
    }
    switch (ch.type) {
      case 'emergency':
        return <Zap className="w-3.5 h-3.5" />;
      case 'location':
        return <MapPin className="w-3.5 h-3.5" />;
      case 'camp':
        return <Tent className="w-3.5 h-3.5" />;
    }
  };

  const renderGroup = (title: string, items: ChatChannel[], color: string) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-6">
        <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 px-2 ${color}`}>{title}</h3>
        <div className="space-y-1">
          {items.map((ch) => {
            const isActive = ch.id === activeChannelId;
            return (
              <button
                key={ch.id}
                onClick={() => onSelectChannel(ch.id)}
                className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-white/15 text-white border border-white/20 shadow-md'
                    : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className={isActive ? 'text-white' : 'text-neutral-400'}>
                    {iconForType(ch)}
                  </span>
                  <span className="truncate">{ch.name}</span>
                </div>
                {ch.code && (
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-neutral-300 shrink-0 font-bold">
                    {ch.code}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Connection Status */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-powder" />
          <span className="text-xs font-black text-white uppercase tracking-wider">{t('nav_chat')}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
            {isConnected ? 'RELAY SYNC READY' : 'LOCAL P2P MESH ACTIVE'}
          </span>
        </div>
      </div>

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-3">
        {renderGroup(`Agency Dispatch Stations`, agencyChannels, 'text-rose-400')}
        {renderGroup(`Broadcast Channels`, emergencyChannels, 'text-amber-400')}
        {renderGroup(`Geo Sectors`, locationChannels, 'text-indigo-400')}
        {renderGroup(`Relief Camps`, campChannels, 'text-neutral-400')}
      </div>
    </div>
  );
}
