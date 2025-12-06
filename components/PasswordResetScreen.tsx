import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Lock, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { hapticSuccess, hapticError } from '../utils/hapticService';
import { APP_NAME_LOWER, ASSETS } from '../brand';

const MotionDiv = motion.div as any;

interface Props {
    onSuccess: () => void;
}

export const PasswordResetScreen: React.FC<Props> = ({ onSuccess }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            hapticError();
            toast.error('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            hapticError();
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            
            if (error) throw error;
            
            hapticSuccess();
            setSuccess(true);
            
            // Wait a moment to show success state, then continue
            setTimeout(() => {
                onSuccess();
            }, 2000);
        } catch (error: any) {
            hapticError();
            toast.error(error.message || 'Failed to update password');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#0D0D0D] flex flex-col">
            {/* Header */}
            <div className="bg-[#FFC244] overflow-hidden">
                <div className="px-6 pb-8 flex flex-col items-center" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 3rem)' }}>
                    <MotionDiv
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                        className="mb-4 relative"
                    >
                        <div className="absolute inset-0 bg-white/40 rounded-full blur-2xl scale-150" />
                        <img 
                            src={ASSETS.logo} 
                            alt="Plum Logo" 
                            className="w-20 h-20 object-contain relative z-10 drop-shadow-lg"
                        />
                    </MotionDiv>
                    <h1 className="text-2xl font-black text-black tracking-tight">{APP_NAME_LOWER}</h1>
                </div>
                <div className="h-6 bg-[#0D0D0D] rounded-t-[24px]" />
            </div>

            {/* Content */}
            <div className="flex-1 px-6 pt-6 pb-8 overflow-y-auto">
                <MotionDiv 
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="max-w-md mx-auto"
                >
                    {!success ? (
                        <>
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-[#1A1A1A] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Lock size={28} className="text-[#FFC244]" />
                                </div>
                                <h2 className="text-xl font-bold text-white mb-2">Create New Password</h2>
                                <p className="text-[#A0A0A0] text-sm">
                                    Your new password must be at least 6 characters.
                                </p>
                            </div>

                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <div>
                                    <label htmlFor="new-password" className="block text-[#A0A0A0] text-xs font-medium mb-2 ml-1">
                                        New Password
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6B6B] group-focus-within:text-[#FFC244] transition-colors">
                                            <Lock size={18} />
                                        </div>
                                        <input 
                                            id="new-password"
                                            type="password" 
                                            placeholder="Enter new password"
                                            autoComplete="new-password"
                                            className="w-full bg-[#1A1A1A] text-white rounded-xl py-4 pl-12 pr-4 outline-none border border-[#333333] focus:border-[#FFC244] focus:ring-2 focus:ring-[#FFC244]/20 transition-all font-medium placeholder-[#6B6B6B] text-[15px]"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="confirm-password" className="block text-[#A0A0A0] text-xs font-medium mb-2 ml-1">
                                        Confirm Password
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6B6B] group-focus-within:text-[#FFC244] transition-colors">
                                            <Lock size={18} />
                                        </div>
                                        <input 
                                            id="confirm-password"
                                            type="password" 
                                            placeholder="Confirm new password"
                                            autoComplete="new-password"
                                            className="w-full bg-[#1A1A1A] text-white rounded-xl py-4 pl-12 pr-4 outline-none border border-[#333333] focus:border-[#FFC244] focus:ring-2 focus:ring-[#FFC244]/20 transition-all font-medium placeholder-[#6B6B6B] text-[15px]"
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                    {confirmPassword && newPassword !== confirmPassword && (
                                        <p className="text-red-400 text-xs mt-2 ml-1">Passwords do not match</p>
                                    )}
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={loading || (confirmPassword !== '' && newPassword !== confirmPassword)}
                                    className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                        <>
                                            Update Password <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <MotionDiv
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            >
                                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 size={48} className="text-green-400" />
                                </div>
                            </MotionDiv>
                            <h2 className="text-2xl font-bold text-white mb-3">Password Updated!</h2>
                            <p className="text-[#A0A0A0] text-sm">
                                Redirecting you to the app...
                            </p>
                        </div>
                    )}
                </MotionDiv>
            </div>
        </div>
    );
};

