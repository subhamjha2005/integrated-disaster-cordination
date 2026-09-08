'use client';

import { motion } from 'framer-motion';
import { Package, Truck, CheckCircle2, Factory } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { getTranslation } from '@/lib/translations';

interface TrackingProps {
  trackingId: string;
  itemName: string;
  quantity: number;
}

export function DonationTracker({ trackingId, itemName, quantity }: TrackingProps) {
  const { language } = useAppStore();
  const t = (key: any) => getTranslation(language, key);

  const steps = [
    { title: 'rec_hub', icon: Factory, completed: true },
    { title: 'sort_pack', icon: Package, completed: true },
    { title: 'in_transit', icon: Truck, completed: true, active: true },
    { title: 'arr_camp', icon: CheckCircle2, completed: false }
  ];

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
      {/* Background glow for current status */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 relative z-10 gap-3">
        <div>
          <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {t('live_shipment')}
          </h3>
          <p className="text-neutral-400 font-mono text-sm leading-relaxed flex items-center gap-2 flex-wrap">
            <span className="text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{trackingId}</span>
            <span className="text-white font-semibold">&bull; {quantity}x {itemName}</span>
          </p>
        </div>
        <div className="px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center shadow-sm">
          <Truck className="w-4 h-4 text-emerald-400 mr-2" />
          <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">{t('out_delivery')}</span>
        </div>
      </div>

      <div className="relative z-10 pt-2 pb-1">
        {/* Progress Line */}
        <div className="absolute top-8 left-10 right-10 h-1 bg-neutral-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '66%' }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-emerald-400"
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between items-start">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="flex flex-col items-center z-10">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.2 }}
                  className={`w-11 h-11 rounded-full flex items-center justify-center relative transition-all duration-300 ${
                    step.completed
                      ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] border border-indigo-400'
                      : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
                  } ${step.active ? 'ring-4 ring-emerald-500/30 bg-emerald-600 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.6)]' : ''}`}
                >
                  <Icon className="w-5 h-5" />
                </motion.div>
                <div className="mt-3 text-center max-w-[85px]">
                  <p className={`text-[11px] font-bold uppercase tracking-wider leading-tight ${step.active ? 'text-emerald-400 font-extrabold' : step.completed ? 'text-white' : 'text-neutral-500'}`}>
                    {t(step.title as any)}
                  </p>
                  {step.active && (
                    <p className="text-[10px] text-emerald-300/80 mt-1 font-mono font-semibold">{t('est_time')}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
