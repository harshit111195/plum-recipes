
import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-brand-text text-white px-4 py-2 flex items-center justify-center gap-2 text-[13px] font-bold shadow-lg animate-in slide-in-from-top-full">
        <WifiOff size={14} className="text-brand-primary" />
        <span>No Internet Connection. AI features are paused.</span>
    </div>
  );
};
