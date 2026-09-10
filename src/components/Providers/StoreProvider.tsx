'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

// Guard against zero-dimension canvas getImageData calls (IndexSizeError) globally
if (typeof window !== 'undefined' && typeof CanvasRenderingContext2D !== 'undefined') {
  const origGetImageData = CanvasRenderingContext2D.prototype.getImageData;
  CanvasRenderingContext2D.prototype.getImageData = function (sx: number, sy: number, sw: number, sh: number, ...args: any[]) {
    if (sw <= 0 || sh <= 0) {
      return this.createImageData(Math.max(1, Math.abs(sw) || 1), Math.max(1, Math.abs(sh) || 1));
    }
    return origGetImageData.call(this, sx, sy, sw, sh, ...args);
  };
}

export function StoreProvider({
  children,
  initialState
}: {
  children: React.ReactNode;
  initialState: any;
}) {
  const setHydratedState = useAppStore((state) => state.setHydratedState);

  useEffect(() => {
    setHydratedState(initialState || {});

    // Restore persisted theme
    const savedTheme = localStorage.getItem('quantum_theme');
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light-theme');
      useAppStore.setState({ theme: 'light' });
    } else {
      document.documentElement.classList.remove('light-theme');
    }

    // Restore persisted language
    const savedLang = localStorage.getItem('quantum_lang');
    if (savedLang) {
      useAppStore.setState({ language: savedLang as any });
    }

    // Cross-tab Synchronization
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'quantum_theme') {
        const newTheme = e.newValue as 'light' | 'dark';
        useAppStore.setState({ theme: newTheme });
        if (newTheme === 'light') {
          document.documentElement.classList.add('light-theme');
        } else {
          document.documentElement.classList.remove('light-theme');
        }
      }
      if (e.key === 'quantum_lang') {
        useAppStore.setState({ language: e.newValue as any });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [initialState, setHydratedState]);

  return <>{children}</>;
}
