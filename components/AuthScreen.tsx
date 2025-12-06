
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Mail, Lock, Loader2, ArrowRight, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { hapticSuccess, hapticError } from '../utils/hapticService';
import { APP_NAME, APP_NAME_LOWER, APP_TAGLINE, ASSETS, MESSAGES } from '../brand';

type AuthView = 'login' | 'signup' | 'forgot' | 'reset';

const MotionDiv = motion.div as any;

interface Props {
    onSuccess: () => void;
}

// Static food icons for background decoration
const FOOD_ICONS = ['🍕', '🥗', '🍳', '🥑', '🍝', '🥕', '🍰', '🌮', '🍜', '🥐', '🍓', '🧁'];

export const AuthScreen: React.FC<Props> = ({ onSuccess }) => {
    const [view, setView] = useState<AuthView>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
    const [isExiting, setIsExiting] = useState(false);
    const [resetEmailSent, setResetEmailSent] = useState(false);

    // Check for password recovery event (when user clicks reset link from email)
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setView('reset');
            }
        });

        // Check URL for recovery token (web flow)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        if (hashParams.get('type') === 'recovery') {
            setView('reset');
        }

        return () => subscription.unsubscribe();
    }, []);

    const isLogin = view === 'login';

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (view === 'login') {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                hapticSuccess();
                toast.success(MESSAGES.welcomeBack, { icon: '👨‍🍳' });
                setIsExiting(true);
                setTimeout(() => {
                    onSuccess();
                }, 600);
            } else if (view === 'signup') {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                hapticSuccess();
                toast.success(MESSAGES.accountCreated, { icon: '🚀' });
                setIsExiting(true);
                setTimeout(() => {
                    onSuccess();
                }, 600);
            }
        } catch (error: any) {
            hapticError();
            toast.error(error.message || 'Authentication failed');
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            toast.error('Please enter your email address');
            return;
        }
        setLoading(true);

        try {
            const redirectUrl = typeof window !== 'undefined' 
                ? `${window.location.origin}${window.location.pathname}#type=recovery`
                : undefined;

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: redirectUrl,
            });
            
            if (error) throw error;
            
            hapticSuccess();
            setResetEmailSent(true);
        } catch (error: any) {
            hapticError();
            toast.error(error.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

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
            toast.success('Password updated successfully!', { icon: '🔐' });
            
            // Clear the recovery hash from URL
            if (window.location.hash.includes('type=recovery')) {
                window.location.hash = '';
            }
            
            setIsExiting(true);
            setTimeout(() => {
                onSuccess();
            }, 600);
        } catch (error: any) {
            hapticError();
            toast.error(error.message || 'Failed to update password');
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEmail('');
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setResetEmailSent(false);
    };

    const handleSocialLogin = async (provider: 'google' | 'apple') => {
        setSocialLoading(provider);
        try {
            const isNative = typeof window !== 'undefined' && 
                (window as any).Capacitor?.isNativePlatform();
            
            if (isNative) {
                const { Browser } = await import('@capacitor/browser');
                const { data, error } = await supabase.auth.signInWithOAuth({
                    provider,
                    options: {
                        redirectTo: 'com.plum.app://auth-callback',
                        skipBrowserRedirect: true,
                    },
                });
                if (error) throw error;
                if (data?.url) {
                    await Browser.open({ 
                        url: data.url,
                        windowName: '_blank',
                        presentationStyle: 'popover',
                    });
                }
            } else {
                const { error } = await supabase.auth.signInWithOAuth({
                    provider,
                    options: {
                        redirectTo: window.location.origin,
                    },
                });
                if (error) throw error;
            }
        } catch (error: any) {
            hapticError();
            toast.error(`Could not connect to ${provider}`);
            setSocialLoading(null);
        }
    };

    return (
        <MotionDiv
            initial={{ opacity: 1, scale: 1 }}
            animate={{ 
                opacity: isExiting ? 0 : 1,
                scale: isExiting ? 0.95 : 1
            }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 w-full flex flex-col overflow-y-auto overflow-x-hidden bg-[#0D0D0D]"
        >
            {/* ========== YELLOW HEADER SECTION ========== */}
            <div className="relative bg-[#FFC244] overflow-hidden">
                {/* Decorative food icons */}
                <div className="absolute inset-0 overflow-hidden opacity-20">
                    {FOOD_ICONS.map((icon, i) => (
                        <span
                            key={i}
                            className="absolute text-4xl"
                            style={{
                                left: `${(i * 37) % 100}%`,
                                top: `${(i * 23) % 100}%`,
                                transform: `rotate(${i * 30}deg)`,
                            }}
                        >
                            {icon}
                        </span>
                    ))}
                </div>
                
                {/* Header content - pt-safe moves content below notch, background still extends up */}
                <div className="relative z-10 px-6 pt-12 pb-16 flex flex-col items-center" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 3rem)' }}>
                    {/* Logo with glow */}
                    <MotionDiv
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                        className="mb-4 relative"
                    >
                        <div className="absolute inset-0 bg-white/40 rounded-full blur-2xl scale-150" />
                        <img 
                            src={ASSETS.logo} 
                            alt={ASSETS.logoAlt} 
                            className="w-28 h-28 object-contain relative z-10 drop-shadow-lg"
                        />
                    </MotionDiv>
                    
                    {/* App name */}
                    <MotionDiv
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                    >
                        <h1 className="text-4xl font-black text-black tracking-tight">{APP_NAME_LOWER}</h1>
                    </MotionDiv>
                    
                    {/* Tagline */}
                    <MotionDiv
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                    >
                        <p className="text-black/70 text-sm font-medium mt-1">{APP_TAGLINE}</p>
                    </MotionDiv>
                </div>
                
                {/* Curved bottom edge */}
                <div className="absolute bottom-0 left-0 right-0 h-6 bg-[#0D0D0D] rounded-t-[24px]" />
            </div>

            {/* ========== MAIN CONTENT ========== */}
            <div className="flex-1 px-6 pt-6 pb-8 overflow-y-auto">
                <MotionDiv 
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="max-w-md mx-auto"
                >
                    {/* Toggle Login/Signup (only shown for login/signup views) */}
                    {(view === 'login' || view === 'signup') && (
                        <div className="flex gap-2 p-1 bg-[#1A1A1A] rounded-2xl mb-6">
                            <button
                                onClick={() => { setView('login'); resetForm(); }}
                                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                                    view === 'login' 
                                        ? 'bg-[#FFC244] text-black' 
                                        : 'text-[#A0A0A0] hover:text-white'
                                }`}
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => { setView('signup'); resetForm(); }}
                                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                                    view === 'signup' 
                                        ? 'bg-[#FFC244] text-black' 
                                        : 'text-[#A0A0A0] hover:text-white'
                                }`}
                            >
                                Create Account
                            </button>
                        </div>
                    )}

                    {/* Back button for forgot/reset views */}
                    {(view === 'forgot' || view === 'reset') && (
                        <button
                            onClick={() => { setView('login'); resetForm(); }}
                            className="flex items-center gap-2 text-[#A0A0A0] hover:text-white mb-6 transition-colors"
                        >
                            <ArrowLeft size={18} />
                            <span className="text-sm font-medium">Back to Sign In</span>
                        </button>
                    )}

                    <AnimatePresence mode="wait">
                        {/* ========== LOGIN / SIGNUP VIEW ========== */}
                        {(view === 'login' || view === 'signup') && (
                            <MotionDiv
                                key="auth-form"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.2 }}
                            >
                                {/* Social Login Buttons */}
                                <div className="grid grid-cols-2 gap-3 mb-5">
                                    <button
                                        onClick={() => handleSocialLogin('apple')}
                                        disabled={!!socialLoading}
                                        className="flex items-center justify-center gap-2 bg-[#1A1A1A] h-14 rounded-2xl text-white font-bold text-sm border border-[#333333] hover:bg-[#2A2A2A] active:scale-[0.98] transition disabled:opacity-50"
                                    >
                                        {socialLoading === 'apple' ? <Loader2 size={18} className="animate-spin" /> : (
                                            <>
                                                <svg viewBox="0 0 384 512" width="18" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 43.3-25.6 68.8 26.1 2 52.3-15.9 69.5-31.2z"/></svg>
                                                Apple
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleSocialLogin('google')}
                                        disabled={!!socialLoading}
                                        className="flex items-center justify-center gap-2 bg-[#1A1A1A] h-14 rounded-2xl text-white font-bold text-sm border border-[#333333] hover:bg-[#2A2A2A] active:scale-[0.98] transition disabled:opacity-50"
                                    >
                                        {socialLoading === 'google' ? <Loader2 size={18} className="animate-spin" /> : (
                                            <>
                                                <svg viewBox="0 0 24 24" width="18" height="18"><g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.769 -21.864 51.959 -21.864 51.129 C -21.864 50.299 -21.734 49.489 -21.484 48.729 L -21.484 45.639 L -25.464 45.639 C -26.284 47.269 -26.754 49.129 -26.754 51.129 C -26.754 53.129 -26.284 54.989 -25.464 56.619 L -21.484 53.529 Z"/><path fill="#EA4335" d="M -14.754 43.769 C -12.984 43.769 -11.404 44.379 -10.154 45.579 L -6.734 42.159 C -8.804 40.229 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.769 -14.754 43.769 Z"/></g></svg>
                                                Google
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Divider */}
                                <div className="relative flex py-3 items-center mb-5">
                                    <div className="flex-grow border-t border-[#333333]"></div>
                                    <span className="flex-shrink-0 mx-4 text-[#6B6B6B] text-[11px] font-bold uppercase tracking-wider">or continue with email</span>
                                    <div className="flex-grow border-t border-[#333333]"></div>
                                </div>

                                {/* Email Form */}
                                <form onSubmit={handleEmailAuth} className="space-y-4" aria-label="Sign in form">
                                    <div>
                                        <label htmlFor="auth-email" className="block text-[#A0A0A0] text-xs font-medium mb-2 ml-1">
                                            Email Address
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6B6B] group-focus-within:text-[#FFC244] transition-colors">
                                                <Mail size={18} aria-hidden="true" />
                                            </div>
                                            <input 
                                                id="auth-email"
                                                type="email" 
                                                placeholder="you@example.com"
                                                autoComplete="email"
                                                className="w-full bg-[#1A1A1A] text-white rounded-xl py-4 pl-12 pr-4 outline-none border border-[#333333] focus:border-[#FFC244] focus:ring-2 focus:ring-[#FFC244]/20 transition-all font-medium placeholder-[#6B6B6B] text-[15px]"
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="auth-password" className="block text-[#A0A0A0] text-xs font-medium mb-2 ml-1">
                                            Password
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6B6B] group-focus-within:text-[#FFC244] transition-colors">
                                                <Lock size={18} aria-hidden="true" />
                                            </div>
                                            <input 
                                                id="auth-password"
                                                type="password" 
                                                placeholder={isLogin ? "Enter your password" : "Create a password (min 6 chars)"}
                                                autoComplete={isLogin ? "current-password" : "new-password"}
                                                className="w-full bg-[#1A1A1A] text-white rounded-xl py-4 pl-12 pr-4 outline-none border border-[#333333] focus:border-[#FFC244] focus:ring-2 focus:ring-[#FFC244]/20 transition-all font-medium placeholder-[#6B6B6B] text-[15px]"
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                required
                                                minLength={6}
                                            />
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <button 
                                        type="submit" 
                                        disabled={loading}
                                        className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                            <>
                                                {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={18} />
                                            </>
                                        )}
                                    </button>
                                </form>

                                {/* Forgot Password (for login only) */}
                                {isLogin && (
                                    <div className="text-center mt-4">
                                        <button 
                                            onClick={() => setView('forgot')}
                                            className="text-[13px] text-[#A0A0A0] hover:text-[#FFC244] transition-colors"
                                        >
                                            Forgot your password?
                                        </button>
                                    </div>
                                )}

                                {/* Terms text (for signup only) */}
                                {view === 'signup' && (
                                    <p className="text-center mt-4 text-[11px] text-[#6B6B6B] leading-relaxed">
                                        By creating an account, you agree to our{' '}
                                        <span className="text-[#FFC244]">Terms of Service</span> and{' '}
                                        <span className="text-[#FFC244]">Privacy Policy</span>
                                    </p>
                                )}
                            </MotionDiv>
                        )}

                        {/* ========== FORGOT PASSWORD VIEW ========== */}
                        {view === 'forgot' && (
                            <MotionDiv
                                key="forgot-form"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                {!resetEmailSent ? (
                                    <>
                                        <div className="text-center mb-6">
                                            <div className="w-16 h-16 bg-[#1A1A1A] rounded-full flex items-center justify-center mx-auto mb-4">
                                                <KeyRound size={28} className="text-[#FFC244]" />
                                            </div>
                                            <h2 className="text-xl font-bold text-white mb-2">Reset Password</h2>
                                            <p className="text-[#A0A0A0] text-sm">
                                                Enter your email and we'll send you a link to reset your password.
                                            </p>
                                        </div>

                                        <form onSubmit={handleForgotPassword} className="space-y-4">
                                            <div>
                                                <label htmlFor="reset-email" className="block text-[#A0A0A0] text-xs font-medium mb-2 ml-1">
                                                    Email Address
                                                </label>
                                                <div className="relative group">
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6B6B] group-focus-within:text-[#FFC244] transition-colors">
                                                        <Mail size={18} aria-hidden="true" />
                                                    </div>
                                                    <input 
                                                        id="reset-email"
                                                        type="email" 
                                                        placeholder="you@example.com"
                                                        autoComplete="email"
                                                        className="w-full bg-[#1A1A1A] text-white rounded-xl py-4 pl-12 pr-4 outline-none border border-[#333333] focus:border-[#FFC244] focus:ring-2 focus:ring-[#FFC244]/20 transition-all font-medium placeholder-[#6B6B6B] text-[15px]"
                                                        value={email}
                                                        onChange={e => setEmail(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <button 
                                                type="submit" 
                                                disabled={loading}
                                                className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                            >
                                                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                                    <>
                                                        Send Reset Link <ArrowRight size={18} />
                                                    </>
                                                )}
                                            </button>
                                        </form>
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <CheckCircle2 size={40} className="text-green-400" />
                                        </div>
                                        <h2 className="text-xl font-bold text-white mb-3">Check Your Email</h2>
                                        <p className="text-[#A0A0A0] text-sm mb-6 leading-relaxed">
                                            We've sent a password reset link to<br />
                                            <span className="text-[#FFC244] font-medium">{email}</span>
                                        </p>
                                        <p className="text-[#6B6B6B] text-xs mb-6">
                                            Didn't receive the email? Check your spam folder or{' '}
                                            <button 
                                                onClick={() => setResetEmailSent(false)}
                                                className="text-[#FFC244] hover:underline"
                                            >
                                                try again
                                            </button>
                                        </p>
                                        <button
                                            onClick={() => { setView('login'); resetForm(); }}
                                            className="text-[#A0A0A0] hover:text-white text-sm font-medium transition-colors"
                                        >
                                            Return to Sign In
                                        </button>
                                    </div>
                                )}
                            </MotionDiv>
                        )}

                        {/* ========== RESET PASSWORD VIEW (after clicking email link) ========== */}
                        {view === 'reset' && (
                            <MotionDiv
                                key="reset-form"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="text-center mb-6">
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
                                                <Lock size={18} aria-hidden="true" />
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
                                                <Lock size={18} aria-hidden="true" />
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
                                        className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                            <>
                                                Update Password <ArrowRight size={18} />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </MotionDiv>
                        )}
                    </AnimatePresence>
                </MotionDiv>
            </div>

            {/* Footer (only for login/signup views) */}
            {(view === 'login' || view === 'signup') && (
                <div className="pb-safe px-6 py-4 text-center">
                    <p className="text-[#6B6B6B] text-xs">
                        {view === 'login' ? (
                            <>New to {APP_NAME}? <button onClick={() => { setView('signup'); resetForm(); }} className="text-[#FFC244] font-bold">Create an account</button></>
                        ) : (
                            <>Already have an account? <button onClick={() => { setView('login'); resetForm(); }} className="text-[#FFC244] font-bold">Sign in</button></>
                        )}
                    </p>
                </div>
            )}
        </MotionDiv>
    );
};
