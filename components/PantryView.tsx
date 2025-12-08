
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useInventory } from '../context/InventoryContext';
import { PantryItem, UNITS, PANTRY_CATEGORIES } from '../types';
import { Plus, Trash2, Search, X, Edit2, Camera, Mic, ScanBarcode, Loader2, AlertCircle, ChevronRight } from 'lucide-react';
import { isPast } from 'date-fns';
import { identifyItemsFromImage, parsePantryNaturalLanguage } from '../services/geminiService';
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { hapticMedium, hapticSuccess } from '../utils/hapticService';
import { useVirtualizer } from '@tanstack/react-virtual';
import { 
  checkMicrophonePermission,
  checkCameraPermission,
  isSpeechRecognitionAvailable,
  getPermissionErrorMessage,
  detectPlatform
} from '../utils/permissionService';

// Category emoji mapping
const CATEGORY_ICONS: Record<string, string> = {
  'Produce': '🥬',
  'Meat': '🥩',
  'Dairy': '🧀',
  'Bakery': '🥐',
  'Frozen': '🧊',
  'Grains': '🌾',
  'Beverages': '🥤',
  'Snacks': '🍿',
  'Spices': '🧂',
  'General': '📦',
};

// Memoized pantry item row to prevent unnecessary re-renders
const PantryItemRow = React.memo(({ 
  item, 
  isLast, 
  onEdit, 
  onDelete 
}: { 
  item: PantryItem; 
  isLast: boolean;
  onEdit: (item: PantryItem) => void;
  onDelete: (id: string) => void;
}) => {
  const expiry = item.expiryDate ? new Date(item.expiryDate) : null;
  const isValidDate = expiry && !isNaN(expiry.getTime());
  const isExpired = isValidDate && expiry && isPast(expiry);
  const daysLeft = isValidDate && expiry ? Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  // Surface: #1A1A1A (dark surface) | Divider: #333333
  return (
    <div className={`flex items-center justify-between p-4 bg-brand-surface relative group ${!isLast ? 'border-b border-brand-divider' : ''}`}>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          {/* Text: #FFFFFF (white) */}
          <h3 className="text-[17px] font-semibold text-brand-text">{item.name}</h3>
{/* Expiry badge: Expired=red | Warning=orange | Normal: #0D0D0D bg, #A0A0A0 text */}
          {isValidDate && daysLeft !== null && (
            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md uppercase ${
              isExpired ? 'bg-red-100 text-red-600' : daysLeft <= 3 ? 'bg-orange-100 text-orange-600' : 'bg-brand-background text-brand-text-secondary'
            }`}>
              {isExpired ? 'Expired' : `${daysLeft}d left`}
            </span>
          )}
        </div>
        {/* Text Secondary: #A0A0A0 (muted white) */}
        <p className="text-[15px] text-brand-text-secondary">{item.quantity} {item.unit}</p>
      </div>
      <div className="flex items-center gap-1">
        {/* Edit button: #0D0D0D bg | Icon: #FFC244 (yellow) | Active: #2A2A2A */}
        <button 
          onClick={() => onEdit(item)} 
          aria-label={`Edit ${item.name}`} 
          className="w-9 h-9 flex items-center justify-center rounded-full bg-brand-background text-brand-primary active:bg-brand-surface-secondary transition"
        >
          <Edit2 size={18} />
        </button>
        {/* Delete button: #0D0D0D bg | Icon: #F87171 (error red) | Active: #2A2A2A */}
        <button 
          onClick={() => { hapticMedium(); onDelete(item.id); }} 
          aria-label={`Delete ${item.name}`} 
          className="w-9 h-9 flex items-center justify-center rounded-full bg-brand-background text-brand-error active:bg-brand-surface-secondary transition"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
});

const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

export const PantryView: React.FC = () => {
  const { pantry, addPantryItem, removePantryItem, updatePantryItem } = useInventory();
  const [isAdding, setIsAdding] = useState(false);
  
  // Snap / Image Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isReviewingSnap, setIsReviewingSnap] = useState(false);
  const [snappedItems, setSnappedItems] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const recognitionRef = useRef<any>(null);
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('pcs');
  const [newItemCategory, setNewItemCategory] = useState('General');
  const [newItemExpiry, setNewItemExpiry] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'snap') {
        setIsAdding(true);
        setTimeout(() => { handleCameraClick(); }, 300);
    }
  }, [location]);

  const getDisplayCategory = (raw: string): string => {
      if (!raw) return 'General';
      const exactMatch = PANTRY_CATEGORIES.find(c => c.toLowerCase() === raw.toLowerCase());
      if (exactMatch) return exactMatch;

      const c = raw.toLowerCase();
      if (['fruit', 'fruits', 'vegetable', 'vegetables', 'produce', 'fuits'].some(k => c.includes(k))) return 'Produce';
      if (['meat', 'beef', 'chicken', 'pork', 'seafood', 'fish', 'lamb', 'poultry'].some(k => c.includes(k))) return 'Meat';
      if (['milk', 'cheese', 'yogurt', 'cream', 'dairy', 'butter', 'egg', 'eggs'].some(k => c.includes(k))) return 'Dairy';
      if (['bread', 'bagel', 'pastry', 'bakery', 'croissant', 'bun'].some(k => c.includes(k))) return 'Bakery';
      if (['ice cream', 'frozen', 'pizza'].some(k => c.includes(k))) return 'Frozen';
      if (['rice', 'pasta', 'noodle', 'grain', 'wheat', 'flour', 'cereal', 'oats'].some(k => c.includes(k))) return 'Grains';
      if (['soda', 'juice', 'water', 'beverage', 'drink', 'coffee', 'tea'].some(k => c.includes(k))) return 'Beverages';
      if (['chip', 'cracker', 'snack', 'candy', 'chocolate'].some(k => c.includes(k))) return 'Snacks';
      if (['spice', 'salt', 'pepper', 'herb', 'oil', 'sauce', 'condiment'].some(k => c.includes(k))) return 'Spices';
      return 'General';
  };

  const handleCameraClick = async () => {
      // On web browsers, file input doesn't require permission check - just open it
      // The browser handles camera/photo access automatically
      const platform = detectPlatform();
      
      if (platform === 'web') {
          // Web: Just click the file input - browser handles permissions
          fileInputRef.current?.click();
          return;
      }
      
      // Native apps: Check camera permission first
      const permissionCheck = await checkCameraPermission();
      
      if (!permissionCheck.canRequest) {
          // Permission was previously denied
          const errorMessage = getPermissionErrorMessage('camera', platform);
          toast.error(errorMessage, { duration: 5000 });
          return;
      }

      // Permission is granted or can be requested - open file picker
      fileInputRef.current?.click();
  };

  const startListening = async () => {
      // Check if Speech Recognition is available
      if (!isSpeechRecognitionAvailable()) { 
          toast.error("Voice input is not supported in this browser."); 
          return; 
      }

      // Check microphone permission status before requesting
      const permissionCheck = await checkMicrophonePermission();
      
      if (!permissionCheck.canRequest) {
          // Permission was previously denied
          const platform = detectPlatform();
          const errorMessage = getPermissionErrorMessage('microphone', platform);
          toast.error(errorMessage, { duration: 5000 });
          return;
      }

      // Permission is granted or can be requested - proceed with voice recognition
      try {
          // @ts-ignore - Use standard SpeechRecognition or webkit prefixed version
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          if (!SpeechRecognition) {
              toast.error("Voice input is not supported in this browser. Try Chrome or Safari.");
              return;
          }
          const recognition = new SpeechRecognition();
          recognition.lang = 'en-US';
          recognition.continuous = true;
          recognition.interimResults = true;

          recognition.onstart = () => { 
              setIsListening(true); 
              setVoiceText(''); 
              hapticMedium();
          };
          
          recognition.onresult = (event: any) => {
              const current = Array.from(event.results).map((r: any) => r[0].transcript).join('');
              setVoiceText(current);
          };
          
          recognition.onerror = (event: any) => {
              setIsListening(false);
              
              if (event.error === 'not-allowed') {
                  // Permission denied during request
                  const platform = detectPlatform();
                  const errorMessage = getPermissionErrorMessage('microphone', platform);
                  toast.error(errorMessage, { duration: 5000 });
              } else if (event.error === 'no-speech') {
                  // No speech detected - not an error, just inform user
                  toast.error("No speech detected. Please try again.", { duration: 3000 });
              } else if (event.error === 'audio-capture') {
                  // Microphone not available
                  toast.error("Microphone not available. Please check your device settings.", { duration: 4000 });
              } else {
                  // Other errors
                  toast.error("Voice recognition error. Please try again.", { duration: 3000 });
              }
          };
          
          recognition.onend = () => {
              setIsListening(false);
          };

          recognitionRef.current = recognition;
          recognition.start();
      } catch (error) {
          toast.error("Failed to start voice recognition. Please try again.", { duration: 3000 });
      }
  };

  const stopAndProcessVoice = async () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      if (!voiceText.trim()) return;
      setIsAnalyzing(true);
      try {
          const items = await parsePantryNaturalLanguage(voiceText);
          setSnappedItems(items);
          setIsReviewingSnap(true);
      } catch (e) { 
          toast.error("Could not process voice input."); 
      } finally { 
          setIsAnalyzing(false); 
      }
  };

  const cancelVoice = () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      setVoiceText('');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file.");
      e.target.value = '';
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image is too large. Please use an image under 10MB.");
      e.target.value = '';
      return;
    }
    
    setIsAnalyzing(true);
    const reader = new FileReader();
    
    reader.onerror = () => {
      toast.error("Failed to read image. Please try again.");
      setIsAnalyzing(false);
    };
    
    reader.onloadend = async () => {
      try {
        const base64 = reader.result as string;
        const items = await identifyItemsFromImage(base64);
        if (items && items.length > 0) {
          setSnappedItems(items);
          setIsReviewingSnap(true);
        } else {
          toast.error("No items detected. Try a clearer photo.");
        }
      } catch (error) {
        toast.error("Failed to analyze image. Please try again.");
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSnapItemChange = (index: number, field: string, value: string) => {
    const newItems = [...snappedItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setSnappedItems(newItems);
  };

  const removeSnapItem = (index: number) => setSnappedItems(prev => prev.filter((_, i) => i !== index));

  const confirmBulkAdd = () => {
      hapticSuccess();
      snappedItems.forEach(item => {
          const cleanCategory = getDisplayCategory(item.category);
          addPantryItem({
              name: item.name,
              quantity: item.quantity || '1',
              unit: item.unit || 'pcs',
              category: cleanCategory,
              expiryDate: item.expiryDate || undefined
          });
      });
      setSnappedItems([]);
      setIsReviewingSnap(false);
      setIsAdding(false);
  };

  const resetForm = () => {
    setNewItemName(''); 
    setNewItemQty(''); 
    setNewItemUnit('pcs'); 
    setNewItemCategory('General'); 
    setNewItemExpiry('');
    setEditingId(null); 
    setIsReviewingSnap(false); 
    setSnappedItems([]);
  };

  const handleFabClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resetForm();
    setIsAdding(true);
  };

  const handleAddOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName) return;
    hapticSuccess();
    const itemData = { name: newItemName, quantity: newItemQty || '1', unit: newItemUnit, category: newItemCategory, expiryDate: newItemExpiry || undefined };
    if (editingId) updatePantryItem(editingId, itemData); else addPantryItem(itemData);
    resetForm(); setIsAdding(false);
  };

  const handleEdit = (item: PantryItem) => {
      setNewItemName(item.name);
      setNewItemQty(item.quantity);
      setNewItemUnit(item.unit || 'pcs');
      setNewItemCategory(getDisplayCategory(item.category));
      let dateVal = '';
      if (item.expiryDate) {
          try { dateVal = new Date(item.expiryDate).toISOString().split('T')[0]; } 
          catch(e) { dateVal = item.expiryDate || ''; }
      }
      setNewItemExpiry(dateVal);
      setEditingId(item.id);
      setIsAdding(true);
      setIsReviewingSnap(false);
  };

  // Calculate expiring items count
  const expiringCount = useMemo(() => {
    return pantry.filter(item => {
      if (!item.expiryDate) return false;
      const expiry = new Date(item.expiryDate);
      if (isNaN(expiry.getTime())) return false;
      const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return daysLeft > 0 && daysLeft <= 3;
    }).length;
  }, [pantry]);

  // Memoize filtered and grouped items to prevent recalculation on every render
  const filteredItems = useMemo(() => 
    pantry.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || getDisplayCategory(item.category) === selectedCategory;
      return matchesSearch && matchesCategory;
    }),
    [pantry, searchQuery, selectedCategory]
  );

  const groupedItems = useMemo(() => 
    filteredItems.reduce((acc, item) => {
      const displayCat = getDisplayCategory(item.category);
      (acc[displayCat] = acc[displayCat] || []).push(item);
      return acc;
    }, {} as Record<string, PantryItem[]>),
    [filteredItems]
  );

  // All grouped items (unfiltered) for showing category counts in pills
  const allGroupedItems = useMemo(() => 
    pantry.reduce((acc, item) => {
      const displayCat = getDisplayCategory(item.category);
      (acc[displayCat] = acc[displayCat] || []).push(item);
      return acc;
    }, {} as Record<string, PantryItem[]>),
    [pantry]
  );

  // All categories from full pantry (for filter pills)
  const allCategories = useMemo(() => 
    Object.keys(allGroupedItems).sort((a, b) => {
      const idxA = PANTRY_CATEGORIES.indexOf(a);
      const idxB = PANTRY_CATEGORIES.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    }),
    [allGroupedItems]
  );

  const sortedCategories = useMemo(() => 
    Object.keys(groupedItems).sort((a, b) => {
      const idxA = PANTRY_CATEGORIES.indexOf(a);
      const idxB = PANTRY_CATEGORIES.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    }),
    [groupedItems]
  );

  // Create flattened list for virtualization with category headers
  type VirtualItem = { type: 'header'; category: string } | { type: 'item'; item: PantryItem; isLast: boolean };
  
  const flattenedList = useMemo((): VirtualItem[] => {
    const list: VirtualItem[] = [];
    sortedCategories.forEach(category => {
      list.push({ type: 'header', category });
      const items = groupedItems[category];
      items.forEach((item, index) => {
        list.push({ type: 'item', item, isLast: index === items.length - 1 });
      });
    });
    return list;
  }, [sortedCategories, groupedItems]);

  // Virtualization setup
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: flattenedList.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      // Headers are smaller than items
      return flattenedList[index]?.type === 'header' ? 52 : 72;
    },
    overscan: 5, // Render 5 extra items above/below viewport
  });

  // Memoize handlers to prevent re-renders
  const handleEditCallback = useCallback((item: PantryItem) => handleEdit(item), []);
  const handleDeleteCallback = useCallback((id: string) => removePantryItem(id), [removePantryItem]);

  // Background: #0D0D0D (near black - page bg)
  return (
    <div className="min-h-screen bg-brand-background pb-28 relative">
      {/* Yellow Header Section - extends to top */}
      <div className="relative bg-brand-primary pt-safe overflow-hidden">
        {/* Tomato red slanting stripes - like dashboard */}
        <div className="absolute -right-16 -top-20 w-[200px] h-[350px] bg-brand-secondary rotate-[20deg] opacity-90" />
        <div className="absolute -right-20 -top-10 w-[80px] h-[320px] bg-[#FF6B6B] rotate-[20deg] opacity-70" />
        <div className="absolute -right-24 top-0 w-[50px] h-[300px] bg-[#FF8A8A] rotate-[20deg] opacity-50" />
        
        {/* Decorative circles */}
        <div className="absolute right-6 top-16 w-3 h-3 bg-brand-secondary rounded-full opacity-60" />
        <div className="absolute right-14 top-24 w-2 h-2 bg-white rounded-full opacity-40" />
        
        {/* Header content */}
        <div className="relative z-10 px-5 pt-8 pb-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              {/* Icon + Title */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-3xl">🥬</span>
                <h1 className="text-[28px] font-bold text-black tracking-tight">Your Pantry</h1>
              </div>
              {/* Stats summary */}
              <p className="text-black/70 text-[15px] font-medium">
                {pantry.length} items{expiringCount > 0 && <span className="text-brand-secondary font-semibold"> · {expiringCount} expiring soon</span>}
              </p>
            </div>
          </div>
          
          {/* Search bar in header - even spacing */}
          <div className="relative mb-8">
            <Search size={18} className="absolute left-3 top-3 text-black/40" />
            <input 
              type="text" 
              placeholder="Search pantry..." 
              className="w-full bg-white text-black pl-10 pr-4 py-2.5 rounded-xl text-[16px] placeholder-black/40 focus:outline-none focus:ring-2 focus:ring-black/10 shadow-sm"
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {/* Curved bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-brand-background rounded-t-[24px]" />
      </div>
      
      {/* Category Filter Pills */}
      <div className="px-4 py-3 -mt-1">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {/* All button */}
          <button 
            onClick={() => setSelectedCategory(null)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full border shrink-0 transition-all active:scale-95 ${
              selectedCategory === null 
                ? 'bg-brand-primary border-brand-primary text-black' 
                : 'bg-brand-surface border-brand-divider text-brand-text'
            }`}
          >
            <span className="text-base">📦</span>
            <span className="text-sm font-medium">All</span>
            <span className={`text-xs ${selectedCategory === null ? 'text-black/60' : 'text-brand-text-secondary'}`}>({pantry.length})</span>
          </button>
          {/* Category buttons - use allCategories to keep all visible */}
          {allCategories.map(category => (
            <button 
              key={category}
              onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full border shrink-0 transition-all active:scale-95 ${
                selectedCategory === category 
                  ? 'bg-brand-primary border-brand-primary text-black' 
                  : 'bg-brand-surface border-brand-divider text-brand-text'
              }`}
            >
              <span className="text-base">{CATEGORY_ICONS[category] || '📦'}</span>
              <span className="text-sm font-medium">{category}</span>
              <span className={`text-xs ${selectedCategory === category ? 'text-black/60' : 'text-brand-text-secondary'}`}>({allGroupedItems[category]?.length || 0})</span>
            </button>
          ))}
        </div>
      </div>
      <AnimatePresence>
      {isAdding && (
        <>
            {/* Overlay: black/40 with blur */}
            <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsAdding(false); resetForm(); }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
            {/* Bottom sheet: #0D0D0D (near black) */}
            <MotionDiv initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed bottom-0 left-0 right-0 z-[60] bg-brand-background rounded-t-[32px] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
                {/* Handle bar: #1A1A1A/50 bg | Handle: #6B6B6B (tertiary) */}
                <div className="w-full flex justify-center pt-3 pb-4 bg-brand-surface/50 backdrop-blur-sm sticky top-0 z-20" onClick={() => { setIsAdding(false); resetForm(); }}><div className="w-12 h-1.5 bg-[#6B6B6B] rounded-full" /></div>
                <div className="px-6 pb-safe overflow-y-auto relative min-h-[50vh]">
                    {/* Close button: #2A2A2A bg | Icon: #A0A0A0 (muted) */}
                    <button onClick={() => { setIsAdding(false); resetForm(); }} aria-label="Close add item panel" className="absolute top-0 right-4 p-2 bg-brand-surface-secondary rounded-full text-brand-text-secondary active:opacity-70 z-20"><X size={20} /></button>
                    <div className="pb-8">
                    {/* Analyzing overlay: #1A1A1A/80 bg | Loader: #FFC244 (yellow) | Text: #FFFFFF */}
                    {isAnalyzing && <div className="absolute inset-0 bg-brand-surface/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center rounded-xl"><Loader2 size={32} className="text-brand-primary animate-spin mb-2" /><span className="text-sm font-semibold text-brand-text">Analyzing vibes...</span></div>}
                    {/* Voice listening overlay */}
{/* Voice listening overlay: #1A1A1A/95 (surface with opacity) */}
                    {isListening && (
                        <div className="absolute inset-0 bg-brand-surface/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center animate-in fade-in p-6 text-center rounded-xl">
                            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-6 pulse-ring relative"><Mic size={32} className="text-white relative z-10" /></div>
                            {/* Text: #FFFFFF (white) */}
                            <span className="text-[22px] font-bold text-brand-text mb-2">I'm listening...</span>
                            {/* Voice text box: #0D0D0D bg | Border: #333333 */}
                            <div className="w-full min-h-[60px] max-h-[120px] overflow-y-auto mb-8 bg-brand-background rounded-xl p-3 border border-brand-divider">
                                {/* Text: #FFFFFF | Placeholder: #A0A0A0 */}
                                {voiceText ? <p className="text-brand-text text-lg font-medium leading-relaxed">"{voiceText}"</p> : <p className="text-brand-text-secondary italic">Speak your list (e.g. "Bought 6 eggs, milk, and bread")</p>}
                            </div>
                            {/* Cancel: red text/bg | Done: #7C3AED purple */}
                            <div className="flex gap-4 w-full"><button onClick={cancelVoice} className="flex-1 py-3 text-red-500 font-bold bg-red-900/20 rounded-xl text-sm active:bg-red-900/30 transition">Cancel</button><button onClick={stopAndProcessVoice} disabled={!voiceText} className="flex-1 py-3 bg-brand-button-primary hover:bg-brand-button-primary-hover text-white font-bold rounded-xl text-sm shadow-lg shadow-purple-500/30 active:scale-95 transition disabled:opacity-50 disabled:shadow-none">Done</button></div>
                        </div>
                    )}
                    {/* Review snap section */}
                    {isReviewingSnap ? (
                        <div className="space-y-4 pt-2">
                            {/* Title: #FFFFFF | Count: #A0A0A0 */}
                            <div className="flex justify-between items-center mb-1"><h3 className="text-[19px] font-bold text-brand-text">Did I get this right?</h3><span className="text-xs text-brand-text-secondary">{snappedItems.length} found</span></div>
                            <div className="max-h-[50vh] overflow-y-auto space-y-3 -mx-2 px-2">
                                {/* Empty state: #A0A0A0 */}
                                {snappedItems.length === 0 && <p className="text-center text-sm text-brand-text-secondary py-4">No items detected.</p>}
{/* Snapped items cards: #1A1A1A surface | Border: #333333 */}
                                {snappedItems.map((item, idx) => (
                                    <div key={idx} className="bg-brand-surface p-3 rounded-xl flex flex-col gap-2 relative shadow-sm border border-brand-divider">
                                            <button onClick={() => removeSnapItem(idx)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X size={16}/></button>
                                            {/* Name input: transparent bg | Text: #FFFFFF */}
                                            <input className="bg-transparent font-semibold text-[17px] outline-none w-[90%] text-brand-text" value={item.name} onChange={e => handleSnapItemChange(idx, 'name', e.target.value)} placeholder="Name" />
                                            <div className="flex gap-2">
                                                {/* Inputs: #0D0D0D bg | Text: #FFFFFF */}
                                                <input className="bg-brand-background text-brand-text rounded-lg px-2 py-1.5 w-20 text-sm font-medium" value={item.quantity} onChange={e => handleSnapItemChange(idx, 'quantity', e.target.value)} placeholder="Qty" />
                                                <select value={item.unit} onChange={e => handleSnapItemChange(idx, 'unit', e.target.value)} className="bg-brand-background text-brand-text rounded-lg px-2 py-1.5 text-sm font-medium outline-none">{UNITS.map(u => <option key={u} value={u}>{u}</option>)}</select>
                                                <select value={getDisplayCategory(item.category)} onChange={e => handleSnapItemChange(idx, 'category', e.target.value)} className="bg-brand-background text-brand-text rounded-lg px-2 py-1.5 flex-1 text-sm font-medium outline-none">{PANTRY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                                            </div>
                                    </div>
                                ))}
                            </div>
                            {/* Footer: border #6B6B6B/30 | Cancel: #2A2A2A bg, #FFFFFF text | Add All: #7C3AED purple */}
                            <div className="flex gap-3 mt-4 pt-4 border-t border-brand-text-tertiary/30"><button onClick={() => setIsReviewingSnap(false)} className="flex-1 py-3.5 bg-brand-surface-secondary text-brand-text font-bold rounded-2xl">Cancel</button><button onClick={confirmBulkAdd} className="flex-1 py-3.5 bg-brand-button-primary hover:bg-brand-button-primary-hover text-white font-bold rounded-2xl shadow-lg shadow-purple-500/30">Add All</button></div>
                        </div>
                    ) : (
                        <form onSubmit={handleAddOrUpdate} className="pt-2">
                            {/* Add/Edit form */}
                            {/* Title: #FFFFFF (white) */}
                            <h3 className="text-[22px] font-bold text-brand-text mb-6">{editingId ? 'Edit Item' : 'Add Item'}</h3>
                            {!editingId && (
                                <div className="flex gap-3 mb-8 overflow-x-auto no-scrollbar">
                                    {/* Snap button: #1A1A1A bg | Icon: #FFC244 yellow | Active: #0D0D0D | Border: #333333 */}
                                    <button type="button" onClick={handleCameraClick} className="flex-1 min-w-[100px] py-4 bg-brand-surface text-brand-primary rounded-2xl font-bold flex flex-col items-center justify-center gap-1.5 active:bg-brand-background shadow-sm border border-brand-divider"><Camera size={26} /> <span className="text-xs uppercase tracking-wide">Snap</span></button>
                                    {/* Voice button: #1A1A1A bg | Icon: #FFC244 yellow | Active: #0D0D0D | Border: #333333 */}
                                    <button type="button" onClick={startListening} className="flex-1 min-w-[100px] py-4 bg-brand-surface text-brand-primary rounded-2xl font-bold flex flex-col items-center justify-center gap-1.5 active:bg-brand-background shadow-sm border border-brand-divider"><Mic size={26} /> <span className="text-xs uppercase tracking-wide">Voice</span></button>
                                    <input type="file" ref={fileInputRef} accept="image/jpeg,image/png,image/webp,image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                                </div>
                            )}
                            {/* Form fields */}
                            <div className="space-y-5">
                                {/* Name field: Label #A0A0A0 | Input: #1A1A1A bg, #FFFFFF text, placeholder #6B6B6B, focus border #FFC244/30 */}
                                <div><label className="block text-[13px] font-bold text-brand-text-secondary uppercase mb-1.5 ml-1">Name</label><div className="relative"><input type="text" className="w-full bg-brand-surface p-4 rounded-2xl text-[19px] outline-none text-brand-text font-bold shadow-sm border border-transparent focus:border-brand-primary/30 transition-all placeholder-brand-text-tertiary" placeholder="e.g. Avocado" value={newItemName} onChange={e => setNewItemName(e.target.value)} /></div></div>
                                <div className="flex gap-3">
                                    {/* Qty field: Label #A0A0A0 | Input: #1A1A1A bg, #FFFFFF text */}
                                    <div className="flex-1"><label className="block text-[13px] font-bold text-brand-text-secondary uppercase mb-1.5 ml-1">Qty</label><div className="flex gap-2"><input type="text" className="w-full bg-brand-surface p-4 rounded-2xl text-[19px] outline-none text-brand-text font-bold shadow-sm" placeholder="1" value={newItemQty} onChange={e => setNewItemQty(e.target.value)} /><select className="bg-brand-surface text-brand-text p-4 rounded-2xl text-[17px] outline-none font-medium shadow-sm" value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)}>{UNITS.map(u => <option key={u} value={u}>{u}</option>)}</select></div></div>
                                    {/* Category field: Label #A0A0A0 | Select: #1A1A1A bg, #FFFFFF text */}
                                    <div className="flex-1"><label className="block text-[13px] font-bold text-brand-text-secondary uppercase mb-1.5 ml-1">Category</label><select className="w-full bg-brand-surface text-brand-text p-4 rounded-2xl text-[17px] outline-none font-medium appearance-none shadow-sm" value={newItemCategory} onChange={e => setNewItemCategory(e.target.value)}>{PANTRY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                                </div>
                                {/* Expiry field: Label #A0A0A0 | Input: #1A1A1A bg, #FFFFFF text */}
                                <div><label className="block text-[13px] font-bold text-brand-text-secondary uppercase mb-1.5 ml-1">Expiry Date (Optional)</label><input type="date" className="w-full bg-brand-surface text-brand-text p-4 rounded-2xl text-[17px] outline-none font-medium shadow-sm" value={newItemExpiry} onChange={e => setNewItemExpiry(e.target.value)} /></div>
                                {/* Submit button: #7C3AED purple | Hover: #6D28D9 | Text: white */}
                                <button type="submit" className="w-full bg-brand-button-primary hover:bg-brand-button-primary-hover text-white font-bold text-[19px] py-4 rounded-2xl shadow-lg shadow-purple-500/30 active:scale-[0.98] transition mt-4">{editingId ? 'Save Changes' : 'Add to Pantry'}</button>
                            </div>
                        </form>
                    )}
                    </div>
                </div>
            </MotionDiv>
        </>
      )}
      </AnimatePresence>
      {/* FAB (Floating Action Button): #7C3AED purple bg | Shadow: purple/30 | Icon: white */}
      {typeof document !== 'undefined' && createPortal(
        <button 
          id="tour-pantry-add" 
          onClick={handleFabClick}
          onTouchEnd={handleFabClick}
          aria-label="Add new pantry item"
          className="fixed bottom-24 right-5 w-14 h-14 bg-brand-button-primary rounded-full shadow-xl shadow-purple-500/30 flex items-center justify-center text-white z-40 hover:scale-105 active:scale-90 transition-transform cursor-pointer touch-manipulation"
          style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>,
        document.body
      )}
      {/* Virtualized List Container */}
      {pantry.length > 0 ? (
        <div 
          ref={parentRef}
          className="px-4 overflow-auto"
          style={{ height: 'calc(100vh - 280px)' }} // Account for taller header and nav
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const rowData = flattenedList[virtualRow.index];
              
              if (rowData.type === 'header') {
                // Category Header with Icon
                return (
                  <div
                    key={`header-${rowData.category}`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className="pt-4"
                  >
                    {/* Category header with emoji */}
                    <div className="flex items-center gap-2 mb-3 ml-1">
                      <span className="text-xl">{CATEGORY_ICONS[rowData.category] || '📦'}</span>
                      <h2 className="text-[18px] font-bold text-brand-text">{rowData.category}</h2>
                      <span className="text-[13px] text-brand-text-secondary font-medium">({groupedItems[rowData.category]?.length || 0})</span>
                    </div>
                  </div>
                );
              }
              
              // Pantry Item - Check if it's the first item in a category (needs rounded top)
              const prevItem = virtualRow.index > 0 ? flattenedList[virtualRow.index - 1] : null;
              const nextItem = virtualRow.index < flattenedList.length - 1 ? flattenedList[virtualRow.index + 1] : null;
              const isFirstInCategory = prevItem?.type === 'header';
              const isLastInCategory = nextItem?.type === 'header' || nextItem === null;
              
              return (
                <div
                  key={rowData.item.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {/* Item card: #1A1A1A surface | Border: #333333 */}
                  <div className={`bg-brand-surface shadow-sm border border-brand-divider overflow-hidden ${
                    isFirstInCategory ? 'rounded-t-[20px]' : ''
                  } ${
                    isLastInCategory ? 'rounded-b-[20px] mb-2' : ''
                  }`}>
                    <PantryItemRow
                      item={rowData.item}
                      isLast={rowData.isLast}
                      onEdit={handleEditCallback}
                      onDelete={handleDeleteCallback}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="px-4">
          {/* Empty state */}
          <div className="text-center py-20 opacity-60">
            {/* Icon circle: #2A2A2A bg | Icon: #A0A0A0 */}
            <div className="w-20 h-20 bg-brand-surface-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <ScanBarcode size={32} className="text-brand-text-secondary" />
            </div>
            {/* Title: #FFFFFF | Subtitle: #A0A0A0 */}
            <h3 className="text-xl font-bold text-brand-text">This pantry is giving empty.</h3>
            <p className="text-brand-text-secondary">Tap + to fix that.</p>
          </div>
        </div>
      )}
    </div>
  );
};
