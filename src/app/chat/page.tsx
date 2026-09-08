'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ChannelList } from '@/components/Chat/ChannelList';
import { MessageFeed } from '@/components/Chat/MessageFeed';
import { MessageInput } from '@/components/Chat/MessageInput';
import { MediumSelector } from '@/components/Chat/MediumSelector';
import { EmergencyCodeBar } from '@/components/Chat/EmergencyCodeBar';
import { ChatChannel, ChatMessage, CommMedium } from '@/lib/types';
import {
  getKeyPair,
  aliasFromPubkey,
  publishMessage,
  subscribeToChannel,
  getLocationChannels,
} from '@/lib/nostr';
import {
  saveMessage,
  getMessagesForChannel,
  queueMessage,
  getQueuedMessages,
  clearQueue,
  broadcastMessage,
  onBroadcastMessage,
  isOnline,
  onConnectivityChange,
  deleteMessage,
} from '@/lib/offlineChat';
import { COMM_MEDIUMS, EMERGENCY_CODES, parseEmergencyCode } from '@/lib/commProtocols';
import { Menu, X, Wifi, WifiOff, CloudOff, Radio, ShieldAlert } from 'lucide-react';
import { getTranslation } from '@/lib/translations';

export default function ChatPage() {
  const { camps, language, sendPriorityMessage } = useAppStore();
  const t = (key: any) => getTranslation(language, key);

  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState('emergency-broadcast');
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [online, setOnline] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [selectedMedium, setSelectedMedium] = useState<CommMedium>('wifi');
  const [activeEmergencyCode, setActiveEmergencyCode] = useState<string | null>(null);

  const subRef = useRef<{ close: () => void } | null>(null);
  const { pk: myPubkey } = typeof window !== 'undefined' ? getKeyPair() : { pk: '' };

  // Track online/offline status
  useEffect(() => {
    setOnline(isOnline());
    const cleanup = onConnectivityChange((status) => {
      setOnline(status);
      if (status) {
        flushQueue();
      }
    });
    return cleanup;
  }, []);

  // Listen for BroadcastChannel messages (LAN / Tab / Offline mesh)
  useEffect(() => {
    const cleanup = onBroadcastMessage((msg) => {
      addMessageToState(msg);
    });
    return cleanup;
  }, []);

  // Load cached messages from IndexedDB when switching channels
  useEffect(() => {
    if (!activeChannelId) return;
    getMessagesForChannel(activeChannelId).then((cached) => {
      if (cached.length > 0) {
        setMessages((prev) => ({
          ...prev,
          [activeChannelId]: cached,
        }));
      }
    });
  }, [activeChannelId]);

  // Build channel list including standard Emergency Agency Dispatch Stations
  useEffect(() => {
    const builtChannels: ChatChannel[] = [
      {
        id: 'emergency-broadcast',
        name: t('emergency_broadcast'),
        type: 'emergency',
        description: t('emergency_desc'),
      },
      // Agency Dispatch Stations for Emergency Codes (100, 102, 101, 108)
      {
        id: 'agency-health',
        name: 'City Hospital ER & Trauma Station',
        type: 'agency',
        code: '102',
        description: 'Direct dispatch line for medical emergencies, trauma triage, and blood supplies.',
      },
      {
        id: 'agency-police',
        name: 'Police Command & Rapid Action',
        type: 'agency',
        code: '100',
        description: 'Law enforcement, perimeter cordon, looting prevention, and rapid reaction force.',
      },
      {
        id: 'agency-fire',
        name: 'Fire Station & Hazmat Rescue',
        type: 'agency',
        code: '101',
        description: 'Fire control, hazmat leaks, gas pipelines, and structural containment.',
      },
      {
        id: 'agency-ndrf',
        name: 'NDRF Disaster & Flood Rescue Net',
        type: 'agency',
        code: '108',
        description: 'Search & rescue squads, flood evacuation boats, and heavy rubble extraction.',
      },
    ];

    camps.forEach((camp) => {
      builtChannels.push({
        id: `camp-${camp.id}`,
        name: camp.name,
        type: 'camp',
        campId: camp.id,
        description: camp.purpose,
      });
    });

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const locChannels = getLocationChannels(pos.coords.latitude, pos.coords.longitude);
          locChannels.forEach((lc) => {
            builtChannels.push({
              id: lc.id,
              name: lc.name,
              type: 'location',
              geohash: lc.geohash,
            });
          });
          setChannels([...builtChannels]);
        },
        () => {
          const locChannels = getLocationChannels(26.1388, 91.6625);
          locChannels.forEach((lc) => {
            builtChannels.push({
              id: lc.id,
              name: lc.name,
              type: 'location',
              geohash: lc.geohash,
            });
          });
          setChannels([...builtChannels]);
        },
        { timeout: 5000 }
      );
    }

    setChannels(builtChannels);
  }, [camps]);

  // Subscribe to active channel (via Nostr if on Internet medium, otherwise local mesh)
  useEffect(() => {
    if (!activeChannelId) return;

    if (subRef.current) {
      subRef.current.close();
    }

    if (selectedMedium !== 'internet' || !online) {
      // Offline / Local Wi-Fi Mesh / BLE P2P is always ready locally
      setIsConnected(true);
      return;
    }

    setIsConnected(false);

    const timer = setTimeout(() => {
      try {
        const sub = subscribeToChannel(activeChannelId, (event) => {
          const parsed = parseEmergencyCode(event.content);
          const newMsg: ChatMessage = {
            id: event.id,
            pubkey: event.pubkey,
            content: event.content,
            timestamp: event.created_at,
            channelId: activeChannelId,
            alias: aliasFromPubkey(event.pubkey),
            medium: 'internet',
            dispatchCode: parsed.code || undefined,
            targetAgency: parsed.emergencyInfo ? parsed.emergencyInfo.agencyName : undefined,
          };

          addMessageToState(newMsg);
          saveMessage(newMsg);
          setIsConnected(true);
        });

        subRef.current = sub;
        setTimeout(() => setIsConnected(true), 1500);
      } catch (err) {
        console.error('Subscription error:', err);
        setIsConnected(true);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      if (subRef.current) {
        subRef.current.close();
      }
    };
  }, [activeChannelId, online, selectedMedium]);

  // Helper to add message to state without duplicates
  const addMessageToState = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      const channelMsgs = prev[msg.channelId] || [];
      if (channelMsgs.some((m) => m.id === msg.id)) return prev;

      let updatedMsgs = [...channelMsgs];
      if (!msg.id.startsWith('offline-')) {
        const offlineIndex = updatedMsgs.findIndex(
          (m) =>
            m.id.startsWith('offline-') &&
            m.pubkey === msg.pubkey &&
            m.content === msg.content
        );
        if (offlineIndex !== -1) {
          const offlineMsg = updatedMsgs[offlineIndex];
          deleteMessage(offlineMsg.id).catch(console.error);
          updatedMsgs.splice(offlineIndex, 1);
        }
      }

      return {
        ...prev,
        [msg.channelId]: [...updatedMsgs, msg].sort((a, b) => a.timestamp - b.timestamp),
      };
    });
  }, []);

  // Flush queued messages when back online
  const flushQueue = useCallback(async () => {
    const queued = await getQueuedMessages();
    if (queued.length === 0) return;

    for (const q of queued) {
      await publishMessage(q.channelId, q.content);
    }
    await clearQueue();
    setQueueCount(0);
  }, []);

  // Send message handler with Medium-Aware Routing & Emergency Dispatch Logic
  const handleSendMessage = useCallback(
    async (content: string) => {
      const { pk } = getKeyPair();
      const timestamp = Math.floor(Date.now() / 1000);

      // Parse Emergency Code (e.g. 100, 102, 101, 108)
      const parsed = parseEmergencyCode(content);

      // Construct ChatMessage
      const msgId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newMsg: ChatMessage = {
        id: msgId,
        pubkey: pk,
        content,
        timestamp,
        channelId: activeChannelId,
        alias: aliasFromPubkey(pk),
        medium: selectedMedium,
        dispatchCode: parsed.code || undefined,
        targetAgency: parsed.emergencyInfo ? parsed.emergencyInfo.agencyName : undefined,
        urgency: parsed.emergencyInfo ? parsed.emergencyInfo.urgencyLevel : 1,
      };

      // 1. Immediately store in local IndexedDB and Broadcast to open tabs
      addMessageToState(newMsg);
      await saveMessage(newMsg);
      broadcastMessage(newMsg);

      // 2. If an Emergency Code is provided, also route to target agency's station channel
      if (parsed.emergencyInfo && activeChannelId !== parsed.emergencyInfo.channelId) {
        const agencyMsg: ChatMessage = {
          ...newMsg,
          id: `${msgId}-agency`,
          channelId: parsed.emergencyInfo.channelId,
        };
        addMessageToState(agencyMsg);
        await saveMessage(agencyMsg);
        broadcastMessage(agencyMsg);

        // Also push into store's PriorityMessage Matrix to alert the station terminal
        sendPriorityMessage({
          sender: aliasFromPubkey(pk),
          senderRole: parsed.emergencyInfo.agencyRole,
          urgencyLevel: parsed.emergencyInfo.urgencyLevel,
          content: `[DISPATCH ${parsed.code}] ${parsed.cleanContent}`,
          location: { lat: 26.1388, lng: 91.6625 },
          proximityScore: 9,
        });
      }

      // 3. Medium specific delivery
      if (selectedMedium === 'internet' && online) {
        try {
          const event = await publishMessage(activeChannelId, content);
          if (event && parsed.emergencyInfo && activeChannelId !== parsed.emergencyInfo.channelId) {
            await publishMessage(parsed.emergencyInfo.channelId, content);
          }
        } catch (err) {
          console.warn('Internet broadcast failed, queued locally:', err);
          await queueMessage(activeChannelId, content);
          setQueueCount((prev) => prev + 1);
        }
      } else {
        // Offline / Local Wi-Fi / Bluetooth BLE:
        // Always queue for asynchronous store-and-forward hopping
        await queueMessage(activeChannelId, content);
        setQueueCount((prev) => prev + 1);
      }
    },
    [activeChannelId, online, selectedMedium, addMessageToState, sendPriorityMessage]
  );

  const activeChannel = channels.find((c) => c.id === activeChannelId);
  const currentMessages = messages[activeChannelId] || [];
  const currentSpec = COMM_MEDIUMS[selectedMedium];

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex rounded-3xl overflow-hidden glass-panel border border-white/10 relative shadow-2xl">
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="lg:hidden absolute top-2 left-2 z-50 p-2 neo-btn rounded-xl text-neutral-400"
        >
          {showSidebar ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        {/* Channel Sidebar */}
        <div
          className={`${
            showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } absolute lg:relative z-40 w-64 h-full bg-[var(--bg-panel)] border-r border-white/10 transition-transform duration-300 shrink-0`}
        >
          <ChannelList
            channels={channels}
            activeChannelId={activeChannelId}
            onSelectChannel={(id) => {
              setActiveChannelId(id);
              setShowSidebar(false);
            }}
            isConnected={isConnected}
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-neutral-950/60">
          
          {/* Bearer Medium Selector & Operational Guide Header */}
          <MediumSelector
            selectedMedium={selectedMedium}
            onSelectMedium={(m) => setSelectedMedium(m)}
          />

          {/* Quick Dial Emergency Agency Code Bar */}
          <EmergencyCodeBar
            activeCode={activeEmergencyCode}
            onSelectCode={(code) => setActiveEmergencyCode(code)}
          />

          {/* Channel Info Bar */}
          <div className="px-6 py-3 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-white uppercase tracking-wider">
                  {activeChannel?.name || t('select_channel')}
                </h2>
                {activeChannel?.code && (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold">
                    CODE [{activeChannel.code}] STATION
                  </span>
                )}
              </div>
              {activeChannel?.description && (
                <p className="text-[9px] text-neutral-400 uppercase tracking-widest mt-0.5">
                  {activeChannel.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Active Bearer Badge */}
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-mono font-bold uppercase"
                style={{
                  color: currentSpec.color,
                  borderColor: `${currentSpec.color}40`,
                  backgroundColor: `${currentSpec.color}15`,
                }}
              >
                <span>{currentSpec.icon}</span>
                <span>{currentSpec.badge}</span>
              </div>

              {/* Status indicator */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-wider">
                  {selectedMedium === 'internet' ? (online ? 'UPLINK ACTIVE' : 'OFFLINE QUEUE') : 'LOCAL MESH ACTIVE'}
                </span>
              </div>

              <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">
                {currentMessages.length} {t('msgs_count')}
              </span>
            </div>
          </div>

          {/* Messages Feed */}
          <MessageFeed
            messages={currentMessages}
            myPubkey={myPubkey}
            isConnected={isConnected}
          />

          {/* Message Input with Code Detection & Prefill */}
          <MessageInput
            onSend={handleSendMessage}
            isConnected={true}
            channelName={activeChannel?.name || ''}
            medium={selectedMedium}
            prefillCode={activeEmergencyCode}
            onClearPrefillCode={() => setActiveEmergencyCode(null)}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
