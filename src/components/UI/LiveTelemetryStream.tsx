'use client';

import { useState, useEffect, useRef } from 'react';
import { Terminal, CloudRain, Thermometer, Wind, Gauge } from 'lucide-react';
import { fetchLiveTelemetry, LiveTelemetryData } from '@/lib/disasterApi';

export function LiveTelemetryStream() {
  const [logs, setLogs] = useState<string[]>([]);
  const [telemetry, setTelemetry] = useState<LiveTelemetryData | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadTelemetry() {
      const data = await fetchLiveTelemetry(26.1388, 91.6625);
      if (isMounted && data) {
        setTelemetry(data);
        const timeStr = new Date().toISOString().split('T')[1].slice(0, 8);
        setLogs(prev => [
          ...prev,
          `${timeStr} [OPEN_METEO] LIVE_SYNC: TEMP ${data.temperature}°C | RAIN ${data.rain}mm | WIND ${data.windSpeed}km/h | PRESS ${data.pressure}hPa`,
          `${timeStr} [SYS] TELEMETRY_STATION: GUWAHATI_SECTOR_7 LOCK_OK`
        ].slice(-25));
      }
    }

    loadTelemetry();

    // Poll live environmental telemetry every 60 seconds
    const telemetryInterval = setInterval(loadTelemetry, 60000);

    const systemLogs = [
      '[SYS] HEARTBEAT_SYNC: NODE_ALPHA_01 OK',
      '[UAV_FEED] OVERWATCH_DRONE_07: SECTOR_4_SCAN COMPLETED',
      '[NET] LATENCY_SPIKE DETECTED JORHAT_RELAY: 42ms',
      '[LOG] RESOURCE_ALLOCATION_MATRIX: OPTIMAL',
      '[SYS] DATA_INGESTION_RATE: 4.8MB/s',
      '[AI] CORRELATION_ENGINE: SEISMIC_ACTIVITY_CHECK OK',
      '[NET] ENCRYPTION_ROTATION: SUCCESS 256-AEGIS'
    ];

    let timerId: NodeJS.Timeout;
    const streamData = () => {
      const timeStr = new Date().toISOString().split('T')[1].slice(0, 8);
      const randomLog = systemLogs[Math.floor(Math.random() * systemLogs.length)];
      setLogs(prev => [...prev, `${timeStr} ${randomLog}`].slice(-25));
      timerId = setTimeout(streamData, Math.random() * 3000 + 1500);
    };

    streamData();

    return () => {
      isMounted = false;
      clearInterval(telemetryInterval);
      clearTimeout(timerId);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="glass-panel p-6 rounded-3xl border-l-4 border-sapphire/40 font-mono flex flex-col h-64">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h3 className="text-[10px] font-black text-sapphire uppercase tracking-[0.2em] flex items-center">
          <Terminal className="w-4 h-4 mr-2" />
          Live Open-Meteo Telemetry Stream
        </h3>
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
      </div>

      {/* Live Metric Pills */}
      {telemetry && (
        <div className="grid grid-cols-4 gap-2 mb-3 shrink-0">
          <div className="bg-white/5 p-2 rounded-xl border border-white/5 flex items-center space-x-2">
            <Thermometer className="w-3.5 h-3.5 text-amber-400" />
            <div>
              <p className="text-[8px] text-neutral-400 uppercase">Temp</p>
              <p className="text-xs font-bold text-white">{telemetry.temperature}°C</p>
            </div>
          </div>
          <div className="bg-white/5 p-2 rounded-xl border border-white/5 flex items-center space-x-2">
            <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
            <div>
              <p className="text-[8px] text-neutral-400 uppercase">Rain</p>
              <p className="text-xs font-bold text-white">{telemetry.rain} mm</p>
            </div>
          </div>
          <div className="bg-white/5 p-2 rounded-xl border border-white/5 flex items-center space-x-2">
            <Wind className="w-3.5 h-3.5 text-indigo-400" />
            <div>
              <p className="text-[8px] text-neutral-400 uppercase">Wind</p>
              <p className="text-xs font-bold text-white">{telemetry.windSpeed} km/h</p>
            </div>
          </div>
          <div className="bg-white/5 p-2 rounded-xl border border-white/5 flex items-center space-x-2">
            <Gauge className="w-3.5 h-3.5 text-emerald-400" />
            <div>
              <p className="text-[8px] text-neutral-400 uppercase">Pressure</p>
              <p className="text-xs font-bold text-white">{Math.round(telemetry.pressure)} hPa</p>
            </div>
          </div>
        </div>
      )}
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto custom-scrollbar text-[10px] text-powder/70 space-y-1.5"
      >
        {logs.map((log, i) => (
          <div key={i} className="whitespace-nowrap opacity-80 hover:opacity-100 hover:text-white transition-colors">
            <span className="text-neutral-500 mr-2">{'>'}</span>{log}
          </div>
        ))}
      </div>
    </div>
  );
}

