
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Phone, Lock, CreditCard, Trash2, Loader2, Save, ShieldAlert, Star, Sparkles, Check } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useUser } from '../context/UserContext';
import toast from 'react-hot-toast';
import { APP_NAME } from '../brand';

/**
 * 🎨 MANAGE ACCOUNT MODAL COLOR REFERENCE (Dark Mode)
 * ====================================================
 * Background:     #0D0D0D (near black)
 * Surface:        #1A1A1A (modal background)
 * Surface Alt:    #2A2A2A (inputs, cards)
 * 
 * Text Primary:   #FFFFFF (white)
 * Text Secondary: #A0A0A0 (muted)
 * Text Tertiary:  #6B6B6B (very muted)
 * 
 * Brand Yellow:   #FFC244 (accents)
 * Button Purple:  #7C3AED (primary buttons)
 * Brand Green:    #00A67E (success)
 * Error Red:      #E84142 / #F87171
 * 
 * Divider:        #333333
 */

const MotionDiv = motion.div as any;

interface Props { onClose: () => void; }

export const ManageAccountModal: React.FC<Props> = ({ onClose }) => {
  const { preferences, updatePreferences } = useUser();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'subscription' | 'danger'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Delete Flow State
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirming'>('idle');
  const [deleteInput, setDeleteInput] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { 
        setUser(user); 
        setFullName(user.user_metadata?.full_name || ''); 
        setEmail(user.email || ''); 
        setPhone(user.phone || ''); 
      }
    });
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setIsLoading(true);
    try {
      const updates: any = { data: { full_name: fullName } };
      if (email !== user.email) updates.email = email;
      if (phone !== user.phone) updates.phone = phone;
      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;
      toast.success('Profile updated successfully!');
      if (email !== user.email) toast('Check your email to confirm the change.', { icon: '📧' });
    } catch (error: any) { 
      toast.error(error.message); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match"); return; }
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated successfully'); 
      setNewPassword(''); 
      setConfirmPassword('');
    } catch (error: any) { 
      toast.error(error.message); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const startDeleteProcess = () => {
    setDeleteStep('confirming');
  };

  const cancelDelete = () => {
    setDeleteStep('idle');
    setDeleteInput('');
  };

  const cleanupStorage = async (userId: string) => {
    try {
      const { data: files, error: listError } = await supabase
        .storage
        .from('recipe-images')
        .list(`${userId}/`);
        
      if (listError) throw listError;
      
      if (files && files.length > 0) {
        const pathsToRemove = files.map(f => `${userId}/${f.name}`);
        const { error: removeError } = await supabase
          .storage
          .from('recipe-images')
          .remove(pathsToRemove);
          
        if (removeError) throw removeError;
      }
    } catch (e) {
      console.warn("Failed to cleanup storage, continuing with account deletion...", e);
    }
  };

  const confirmDelete = async () => {
    if (deleteInput !== 'DELETE') return;
    if (!user?.id) return;
    
    setIsLoading(true);
    try { 
      await cleanupStorage(user.id);
      const { error } = await supabase.rpc('delete_own_account', { consent_text: 'DELETE' });
      if (error) throw error;
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn("SignOut failed during deletion cleanup (expected)", e);
      }
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } catch (error: any) { 
      console.error("Delete failed", error);
      toast.error("Failed to delete account. Please try again."); 
      setIsLoading(false); 
    }
  };

  const getInitials = () => {
    if (fullName) return fullName.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return 'U';
  };

  const tabs = [
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'security', icon: Lock, label: 'Security' },
    { id: 'subscription', icon: Star, label: 'Plan' },
    { id: 'danger', icon: ShieldAlert, label: 'Danger' },
  ];

  return (
    <>
      {/* Backdrop */}
      <MotionDiv 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose} 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" 
      />
      
      {/* Modal */}
      <MotionDiv 
        initial={{ y: "100%" }} 
        animate={{ y: 0 }} 
        exit={{ y: "100%" }} 
        transition={{ type: "spring", damping: 25, stiffness: 200 }} 
        className="fixed bottom-0 left-0 right-0 z-[110] bg-brand-background rounded-t-[32px] overflow-hidden shadow-2xl h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-brand-surface border-b border-brand-divider px-5 py-4 flex justify-between items-center">
          <h2 className="text-h2 font-bold text-brand-text">Manage Account</h2>
          <button 
            onClick={onClose} 
            className="w-9 h-9 bg-brand-surface-secondary rounded-full flex items-center justify-center text-brand-text-secondary hover:text-brand-text hover:bg-brand-divider transition"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Tab Bar */}
        <div className="flex bg-brand-surface border-b border-brand-divider px-2">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              className={`flex-1 flex flex-col items-center gap-1 py-3 border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? 'border-brand-primary text-brand-primary' 
                  : 'border-transparent text-brand-text-tertiary hover:text-brand-text-secondary'
              }`}
            >
              <tab.icon size={18} />
              <span className="text-caption font-bold uppercase tracking-wide">{tab.label}</span>
            </button>
          ))}
        </div>
        
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 pb-20">
          
          {/* ========== PROFILE TAB ========== */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
              {/* Avatar */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 bg-brand-primary rounded-2xl flex items-center justify-center text-black text-3xl font-bold shadow-lg shadow-brand-primary/20 mb-3">
                  {getInitials()}
                </div>
                <p className="text-caption text-brand-text-tertiary">Tap avatar to change (coming soon)</p>
              </div>
              
              {/* Full Name */}
              <div>
                <label className="block text-caption font-bold text-brand-text-secondary uppercase mb-2 ml-1 tracking-wider">Full Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-tertiary" />
                  <input 
                    type="text" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)} 
                    className="w-full bg-brand-surface p-4 pl-12 rounded-2xl text-h3 text-brand-text font-medium outline-none focus:ring-2 focus:ring-brand-primary/30 border border-brand-divider focus:border-brand-primary/50 transition placeholder-brand-text-tertiary" 
                    placeholder="Your Name" 
                  />
                </div>
              </div>
              
              {/* Email */}
              <div>
                <label className="block text-caption font-bold text-brand-text-secondary uppercase mb-2 ml-1 tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-tertiary" />
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full bg-brand-surface p-4 pl-12 rounded-2xl text-h3 text-brand-text font-medium outline-none focus:ring-2 focus:ring-brand-primary/30 border border-brand-divider focus:border-brand-primary/50 transition placeholder-brand-text-tertiary" 
                  />
                </div>
              </div>
              
              {/* Phone */}
              <div>
                <label className="block text-caption font-bold text-brand-text-secondary uppercase mb-2 ml-1 tracking-wider">Phone Number</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-tertiary" />
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    className="w-full bg-brand-surface p-4 pl-12 rounded-2xl text-h3 text-brand-text font-medium outline-none focus:ring-2 focus:ring-brand-primary/30 border border-brand-divider focus:border-brand-primary/50 transition placeholder-brand-text-tertiary" 
                    placeholder="+1 234 567 8900" 
                  />
                </div>
              </div>
              
              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={isLoading} 
                className="w-full bg-brand-button-primary hover:bg-brand-button-primary-hover text-white font-bold text-h3 py-4 rounded-2xl shadow-lg shadow-purple-500/20 active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><Save size={18} /> Save Changes</>}
              </button>
            </form>
          )}
          
          {/* ========== SECURITY TAB ========== */}
          {activeTab === 'security' && (
            <form onSubmit={handleUpdatePassword} className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
              {/* Info Banner */}
              <div className="bg-brand-button-primary/10 p-4 rounded-2xl border border-brand-button-primary/20">
                <div className="flex gap-3">
                  <Lock size={20} className="text-brand-button-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-brand-text text-body">Secure your account</h4>
                    <p className="text-brand-text-secondary text-caption mt-1">Use a strong password with at least 6 characters.</p>
                  </div>
                </div>
              </div>
              
              {/* New Password */}
              <div>
                <label className="block text-caption font-bold text-brand-text-secondary uppercase mb-2 ml-1 tracking-wider">New Password</label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  className="w-full bg-brand-surface p-4 rounded-2xl text-h3 text-brand-text font-medium outline-none focus:ring-2 focus:ring-brand-button-primary/30 border border-brand-divider focus:border-brand-button-primary/50 transition placeholder-brand-text-tertiary" 
                  placeholder="••••••••" 
                />
              </div>
              
              {/* Confirm Password */}
              <div>
                <label className="block text-caption font-bold text-brand-text-secondary uppercase mb-2 ml-1 tracking-wider">Confirm Password</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  className="w-full bg-brand-surface p-4 rounded-2xl text-h3 text-brand-text font-medium outline-none focus:ring-2 focus:ring-brand-button-primary/30 border border-brand-divider focus:border-brand-button-primary/50 transition placeholder-brand-text-tertiary" 
                  placeholder="••••••••" 
                />
                {newPassword && confirmPassword && newPassword === confirmPassword && (
                  <p className="text-brand-accent text-caption mt-2 ml-1 flex items-center gap-1">
                    <Check size={14} /> Passwords match
                  </p>
                )}
              </div>
              
              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={isLoading || !newPassword || newPassword !== confirmPassword} 
                className="w-full bg-brand-button-primary hover:bg-brand-button-primary-hover text-white font-bold text-h3 py-4 rounded-2xl shadow-lg shadow-purple-500/20 active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Update Password"}
              </button>
            </form>
          )}
          
          {/* ========== SUBSCRIPTION TAB ========== */}
          {activeTab === 'subscription' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
              {/* Current Plan Card */}
              <div className={`p-5 rounded-2xl relative overflow-hidden ${
                preferences.isPro 
                  ? 'bg-brand-primary' 
                  : 'bg-brand-surface border border-brand-divider'
              }`}>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-caption font-bold uppercase tracking-wider ${preferences.isPro ? 'text-black/60' : 'text-brand-text-secondary'}`}>
                      Current Plan
                    </span>
                    {preferences.isPro && (
                      <span className="bg-black/20 text-black text-caption font-bold px-2 py-1 rounded-full">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className={`text-h1 font-bold mb-1 ${preferences.isPro ? 'text-black' : 'text-brand-text'}`}>
                    {preferences.isPro ? `${APP_NAME} Pro` : 'Free Tier'}
                  </div>
                  <p className={`text-caption ${preferences.isPro ? 'text-black/70' : 'text-brand-text-secondary'}`}>
                    {preferences.isPro ? 'Unlimited AI recipes • No ads • Premium features' : 'Basic features • Ad supported'}
                  </p>
                </div>
                {preferences.isPro && (
                  <Star size={100} className="absolute -right-4 -bottom-4 text-black/10" />
                )}
              </div>
              
              {/* Upgrade Section */}
              {!preferences.isPro && (
                <div className="space-y-3">
                  <h3 className="font-bold text-brand-text text-h3">Upgrade to Pro</h3>
                  
                  {/* Pro Features */}
                  <div className="bg-brand-surface rounded-2xl border border-brand-divider p-4 space-y-3">
                    {[
                      'Unlimited AI recipe generation',
                      'No advertisements',
                      'Advanced nutritional insights',
                      'Priority support',
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-brand-accent/20 flex items-center justify-center">
                          <Check size={12} className="text-brand-accent" />
                        </div>
                        <span className="text-body text-brand-text">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Coming Soon */}
                  <div className="bg-brand-button-primary/10 p-4 rounded-2xl border border-brand-button-primary/20">
                    <p className="text-caption text-brand-text-secondary">
                      <span className="text-brand-button-primary font-bold">Pro membership</span> billing integration coming soon. Contact support for early access.
                    </p>
                  </div>
                  
                  <button 
                    disabled 
                    className="w-full p-4 rounded-2xl flex items-center justify-between bg-brand-surface-secondary border border-brand-divider opacity-60 cursor-not-allowed"
                  >
                    <div className="text-left flex items-center gap-3">
                      <Sparkles size={20} className="text-brand-primary" />
                      <div>
                        <div className="font-bold text-brand-text text-body">Upgrade to Pro</div>
                        <div className="text-caption text-brand-text-tertiary">$4.99 / month</div>
                      </div>
                    </div>
                    <span className="text-brand-text-tertiary font-bold text-caption bg-brand-divider px-2 py-1 rounded">SOON</span>
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* ========== DANGER TAB ========== */}
          {activeTab === 'danger' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
              {/* Warning Banner */}
              <div className="bg-brand-secondary/10 p-5 rounded-2xl border border-brand-secondary/20">
                <div className="flex gap-3 mb-4">
                  <ShieldAlert size={24} className="text-brand-secondary shrink-0" />
                  <div>
                    <h4 className="font-bold text-brand-text text-body">Delete Account</h4>
                    <p className="text-brand-text-secondary text-caption mt-1 leading-relaxed">
                      Permanently delete your account and all associated data. This action <span className="text-brand-secondary font-bold">cannot be undone</span>.
                    </p>
                  </div>
                </div>
                
                {deleteStep === 'idle' ? (
                  <button 
                    onClick={startDeleteProcess} 
                    disabled={isLoading} 
                    className="w-full bg-brand-surface text-brand-secondary font-bold py-3.5 rounded-2xl border border-brand-secondary/30 hover:bg-brand-secondary/10 active:scale-[0.98] transition"
                  >
                    Delete My Account
                  </button>
                ) : (
                  <div className="space-y-3 animate-in fade-in">
                    <p className="text-caption font-bold text-brand-secondary uppercase tracking-wide">
                      Type <span className="select-all bg-brand-background px-1.5 py-0.5 rounded border border-brand-secondary/30 font-mono">DELETE</span> to confirm
                    </p>
                    <input 
                      type="text" 
                      value={deleteInput}
                      onChange={(e) => setDeleteInput(e.target.value)}
                      placeholder="DELETE"
                      className="w-full p-3.5 rounded-2xl bg-brand-background border border-brand-secondary/30 text-brand-text placeholder-brand-text-tertiary outline-none focus:ring-2 focus:ring-brand-secondary/30 font-bold tracking-wider"
                    />
                    <div className="flex gap-3">
                      <button 
                        onClick={cancelDelete}
                        className="flex-1 bg-brand-surface-secondary text-brand-text font-bold py-3.5 rounded-2xl border border-brand-divider hover:bg-brand-divider transition"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={confirmDelete} 
                        disabled={deleteInput !== 'DELETE' || isLoading} 
                        className="flex-1 bg-brand-secondary text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-brand-secondary/30 active:scale-[0.98] transition disabled:opacity-50 disabled:shadow-none flex items-center justify-center"
                      >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Confirm Delete"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Additional Info */}
              <div className="bg-brand-surface p-4 rounded-2xl border border-brand-divider">
                <h4 className="font-bold text-brand-text text-body mb-2">What gets deleted?</h4>
                <ul className="space-y-2 text-caption text-brand-text-secondary">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary"></div>
                    Your profile and preferences
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary"></div>
                    All saved recipes and history
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary"></div>
                    Pantry items and shopping lists
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary"></div>
                    Generated recipe images
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </MotionDiv>
    </>
  );
};
