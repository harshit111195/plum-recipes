
import React, { useEffect, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { Sparkles } from 'lucide-react';
import { CONFIG } from '../config';
import toast from 'react-hot-toast';
import { APP_NAME } from '../brand';

interface AdUnitProps { type?: 'banner' | 'card'; }

export const AdUnit: React.FC<AdUnitProps> = ({ type = 'banner' }) => {
  const { preferences, updatePreferences } = useUser();
  const adRef = useRef<HTMLDivElement>(null);

  // 1. If Pro User, return NULL (No Ads)
  if (preferences.isPro) return null;

  // 2. House Ads (Upgrade to Pro Upsell)
  // Used when AdSense is disabled or configured to show house ads
  if (CONFIG.ads.showHouseAds) {
      const handleUpgrade = () => {
          // Pro billing integration coming soon
          toast.error("Pro membership coming soon! Stay tuned.", { duration: 3000 });
      };

      if (type === 'card') {
          return (
            <div className="bg-[#1A1A1A] rounded-[28px] overflow-hidden p-6 flex flex-col items-center justify-center text-center border border-[#333333] min-h-[300px] relative group">
                <div className="absolute top-2 right-2 text-[10px] text-[#6B6B6B] bg-[#2A2A2A] px-2 py-0.5 rounded-full">ADVERTISEMENT</div>
                <div className="w-16 h-16 bg-[#7C3AED]/20 rounded-full flex items-center justify-center mb-4 text-[#7C3AED]"><Sparkles size={32} fill="currentColor" /></div>
                <h3 className="text-lg font-bold text-white mb-2">Cook without limits.</h3>
                <p className="text-[#A0A0A0] text-sm mb-6 max-w-[200px]">Support the developers and remove these ads forever.</p>
                <button onClick={handleUpgrade} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition">Upgrade to Pro</button>
            </div>
          );
      }
      return (
        <div className="bg-[#1A1A1A] p-4 rounded-[22px] flex items-center justify-between border border-[#333333] relative overflow-hidden">
            <span className="absolute top-0 right-2 text-[8px] text-[#6B6B6B] font-bold tracking-widest">AD</span>
            <div><div className="font-bold text-white text-sm">Remove Ads?</div><div className="text-xs text-[#A0A0A0]">Join {APP_NAME} Pro today.</div></div>
            <button onClick={handleUpgrade} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg active:scale-95 transition">Upgrade</button>
        </div>
      );
  }

  // 3. Google AdSense Implementation
  // This block runs if showHouseAds is FALSE and user is NOT Pro
  
  // Note: AdSense logic inside useEffect to handle script injection
  useEffect(() => {
    try {
        // @ts-ignore
        if (window.adsbygoogle) {
            // @ts-ignore
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
    } catch (e) {
        // Ads blocked or script failed
    }
  }, []);

  const slotId = type === 'banner' ? CONFIG.ads.slots.banner : CONFIG.ads.slots.card;

  return (
    <div className={`overflow-hidden flex items-center justify-center bg-[#1A1A1A] border border-[#333333] ${type === 'card' ? 'rounded-[28px] min-h-[300px]' : 'rounded-[22px] min-h-[90px]'}`}>
        <div className="text-center w-full">
            
            <ins className="adsbygoogle"
                 style={{ display: 'block' }}
                 data-ad-client={CONFIG.ads.adSenseClientId}
                 data-ad-slot={slotId}
                 data-ad-format="auto"
                 data-full-width-responsive="true">
            </ins>
        </div>
    </div>
  );
};
