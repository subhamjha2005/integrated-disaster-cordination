'use client';

import { ChatMessage } from '@/lib/types';
import { useEffect, useRef } from 'react';
import { COMM_MEDIUMS, EMERGENCY_CODES, parseEmergencyCode } from '@/lib/commProtocols';
import { ShieldAlert, Radio, Wifi, Globe, CheckCheck } from 'lucide-react';

interface MessageFeedProps {
  messages: ChatMessage[];
  myPubkey: string;
  isConnected: boolean;
}

export function MessageFeed({ messages, myPubkey, isConnected }: MessageFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (!isConnected) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-2 border-sapphire/30 border-t-indigo-500 animate-spin mx-auto" />
          <p className="text-xs font-black text-powder uppercase tracking-[0.2em] animate-pulse">
            Establishing Radio Carrier...
          </p>
          <p className="text-[9px] text-neutral-500 uppercase tracking-widest">
            Syncing Local Nodes & Cryptographic Relays
          </p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-sm space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-xl">
            <Radio className="w-6 h-6 text-indigo-400" />
          </div>
          <p className="text-sm font-bold text-neutral-300">Channel Idle</p>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Select a medium (Wi-Fi, Bluetooth, or Internet), or dispatch an emergency code (<strong className="text-rose-400">100</strong>, <strong className="text-rose-400">102</strong>, <strong className="text-rose-400">108</strong>) to transmit to agency nodes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 space-y-4">
      {messages.map((msg) => {
        const isMe = msg.pubkey === myPubkey;
        const mediumKey = msg.medium || 'internet';
        const spec = COMM_MEDIUMS[mediumKey] || COMM_MEDIUMS.internet;
        const parsed = parseEmergencyCode(msg.content);
        const dispatchCode = msg.dispatchCode || parsed.code;
        const emergencyInfo = dispatchCode ? EMERGENCY_CODES[dispatchCode] : null;

        return (
          <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] sm:max-w-[70%] ${isMe ? 'order-1' : ''} space-y-1`}>
              
              {/* Alias, Medium badge, & Timestamp */}
              <div className={`flex items-center gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                <span
                  className={`text-[10px] font-black uppercase tracking-wider ${
                    isMe ? 'text-powder' : 'text-neutral-400'
                  }`}
                >
                  {isMe ? 'You' : msg.alias}
                </span>

                {/* Medium badge */}
                <span
                  className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border flex items-center gap-1"
                  style={{
                    color: spec.color,
                    borderColor: `${spec.color}40`,
                    backgroundColor: `${spec.color}10`,
                  }}
                  title={`Transmitted via ${spec.name}`}
                >
                  <span>{spec.icon}</span>
                  <span className="uppercase">{spec.badge}</span>
                </span>

                <span className="text-[8px] text-neutral-600 font-mono">
                  {new Date(msg.timestamp * 1000).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {/* Message bubble */}
              <div
                className={`p-3.5 rounded-2xl text-sm leading-relaxed relative ${
                  emergencyInfo
                    ? 'bg-rose-950/70 border border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.2)] text-white'
                    : isMe
                    ? 'bg-indigo-600/85 text-white rounded-br-sm border border-indigo-500/30'
                    : 'glass-card text-white rounded-bl-sm border border-white/10'
                }`}
              >
                {/* Emergency Dispatch Header if Code present */}
                {emergencyInfo && (
                  <div className="mb-2 pb-2 border-b border-rose-500/30 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{emergencyInfo.icon}</span>
                      <span className="font-mono font-black text-rose-400 uppercase">
                        [{emergencyInfo.code}] {emergencyInfo.title}
                      </span>
                    </div>
                    <span className="text-[8px] font-mono uppercase bg-rose-500/30 text-rose-200 px-1.5 py-0.5 rounded font-bold">
                      URGENCY {emergencyInfo.urgencyLevel}/5
                    </span>
                  </div>
                )}

                <div className="whitespace-pre-wrap break-words">{msg.content}</div>

                {/* Emergency Station Action Alert confirmation */}
                {emergencyInfo && (
                  <div className="mt-2.5 pt-2 border-t border-rose-500/20 text-[10px] text-rose-200/90 flex items-start gap-1.5 font-mono">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <span>{emergencyInfo.actionTaken}</span>
                  </div>
                )}
              </div>

              {/* Delivery Receipt */}
              <div className={`flex items-center gap-1 text-[8px] font-mono text-neutral-500 ${isMe ? 'justify-end' : 'justify-start'}`}>
                <CheckCheck className="w-3 h-3 text-emerald-400" />
                <span>Delivered via {spec.badge}</span>
              </div>

            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
