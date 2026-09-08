'use client';

import { useState, KeyboardEvent, useEffect } from 'react';
import { Send, Wifi, WifiOff, Radio, ShieldAlert } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getTranslation } from '@/lib/translations';
import { CommMedium } from '@/lib/types';
import { COMM_MEDIUMS, parseEmergencyCode } from '@/lib/commProtocols';

interface MessageInputProps {
  onSend: (content: string) => void;
  isConnected: boolean;
  channelName: string;
  medium: CommMedium;
  prefillCode?: string | null;
  onClearPrefillCode?: () => void;
}

export function MessageInput({
  onSend,
  isConnected,
  channelName,
  medium,
  prefillCode,
  onClearPrefillCode,
}: MessageInputProps) {
  const { language } = useAppStore();
  const t = (key: any) => getTranslation(language, key);
  const [text, setText] = useState('');

  // Handle prefilled code selection from the EmergencyCodeBar
  useEffect(() => {
    if (prefillCode) {
      setText((prev) => {
        const { cleanContent } = parseEmergencyCode(prev);
        return `[${prefillCode}] ${cleanContent}`.trim();
      });
      if (onClearPrefillCode) onClearPrefillCode();
    }
  }, [prefillCode, onClearPrefillCode]);

  const detectedCode = parseEmergencyCode(text);
  const spec = COMM_MEDIUMS[medium];

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || !isConnected) return;
    onSend(trimmed);
    setText('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-4 py-3 border-t border-white/10 bg-black/50 space-y-2">
      {/* Live Code Detection Pill */}
      {detectedCode.emergencyInfo && (
        <div className="flex items-center justify-between text-xs px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300">
          <div className="flex items-center gap-2">
            <span className="text-base">{detectedCode.emergencyInfo.icon}</span>
            <span className="font-mono font-bold text-rose-400">
              DISPATCH CODE [{detectedCode.code}] DETECTED:
            </span>
            <span className="font-semibold text-white">
              {detectedCode.emergencyInfo.title}
            </span>
          </div>
          <span className="text-[9px] font-mono text-rose-300 bg-rose-500/30 px-2 py-0.5 rounded-full font-bold">
            URGENCY: {detectedCode.emergencyInfo.urgencyLevel}/5
          </span>
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* Connection / Medium indicator */}
        <div
          className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border"
          style={{
            borderColor: `${spec.color}40`,
            backgroundColor: `${spec.color}10`,
          }}
          title={`Active Bearer: ${spec.name}`}
        >
          <span className="text-sm">{spec.icon}</span>
          <span className="text-[9px] font-mono font-bold uppercase" style={{ color: spec.color }}>
            {spec.badge}
          </span>
        </div>

        {/* Input Field */}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!isConnected}
          placeholder={
            isConnected
              ? `Send via ${spec.badge} (${channelName}) — type '100', '102', etc. to dispatch`
              : t('connecting')
          }
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-sapphire/50 focus:ring-1 focus:ring-sapphire/30 transition-all disabled:opacity-40"
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!isConnected || !text.trim()}
          className={`shrink-0 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            isConnected && text.trim()
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 cursor-pointer'
              : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
          }`}
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
