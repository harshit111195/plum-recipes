
import React, { useState } from 'react';
import { X, Star, Send, Loader2, MessageSquare, CheckCircle2 } from 'lucide-react';
import { logger } from '../services/loggerService';
import { hapticSuccess } from '../utils/hapticService';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabase';
import { APP_VERSION } from '../brand';

const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

interface Props {
  onClose: () => void;
}

export const FeedbackModal: React.FC<Props> = ({ onClose }) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 && !feedback.trim()) return;

    setIsSubmitting(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Detect platform
      const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform();
      const isIOS = isNative && (window as any).Capacitor?.getPlatform() === 'ios';
      const isAndroid = isNative && (window as any).Capacitor?.getPlatform() === 'android';
      const platform = isIOS ? 'ios' : isAndroid ? 'android' : 'web';
      
      // Save to Supabase
      const { error } = await supabase.from('feedback').insert({
        user_id: user?.id || null,
        email: user?.email || null,
        rating: rating || null,
        message: feedback.trim() || null,
        app_version: APP_VERSION,
        platform,
        user_agent: navigator.userAgent,
      });
      
      if (error) {
        logger.error('Failed to save feedback', error);
        throw error;
      }
      
      // Also log for monitoring
      logger.logUserAction('Submitted Feedback', { rating, feedback, platform });
      
      hapticSuccess();
      setSent(true);
      setTimeout(onClose, 2000);
      
    } catch (error) {
      logger.error('Feedback submission failed', error);
      // Still show success to user (graceful degradation)
      hapticSuccess();
      setSent(true);
      setTimeout(onClose, 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {/* Backdrop: black/50 */}
      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-md flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal: #1A1A1A (dark surface) */}
        <MotionDiv
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="bg-brand-surface w-full max-w-sm rounded-[28px] overflow-hidden shadow-2xl relative border border-brand-divider"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          {/* Close Button: #0D0D0D bg | #A0A0A0 icon */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 bg-brand-background rounded-full flex items-center justify-center text-brand-text-secondary hover:bg-brand-surface-secondary active:scale-90 transition z-10"
          >
            <X size={18} strokeWidth={2.5} />
          </button>

          <AnimatePresence mode="wait">
            {sent ? (
              /* ========== SUCCESS STATE ========== */
              <MotionDiv
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="p-10 flex flex-col items-center justify-center text-center"
              >
                {/* Success icon: #00A67E (green) */}
                <MotionDiv
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
                  className="w-20 h-20 bg-brand-accent rounded-full flex items-center justify-center mb-5 shadow-lg shadow-brand-accent/30"
                >
                  <CheckCircle2 size={36} className="text-white" strokeWidth={2.5} />
                </MotionDiv>
                {/* Text: #FFFFFF | #A0A0A0 */}
                <h3 className="text-2xl font-bold text-brand-text mb-2">Message Sent!</h3>
                <p className="text-brand-text-secondary text-[15px] leading-relaxed">
                  Thanks for helping us cook up a better app. 🍳
                </p>
              </MotionDiv>
            ) : (
              /* ========== FORM STATE ========== */
              <MotionDiv
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleSubmit} className="p-6">
                  {/* Header with icon */}
                  <div className="flex items-center gap-3 mb-6">
                    {/* Icon bg: #FFC244 (yellow) */}
                    <div className="w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
                      <MessageSquare size={22} className="text-black" strokeWidth={2} />
                    </div>
                    <div>
                      {/* Title: #FFFFFF | Subtitle: #A0A0A0 */}
                      <h3 className="text-[20px] font-bold text-brand-text">Feedback</h3>
                      <p className="text-[13px] text-brand-text-secondary">Tell the chef what you think</p>
                    </div>
                  </div>

                  {/* Star Rating */}
                  <div className="flex justify-center gap-2 mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <MotionButton
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-1 focus:outline-none transition"
                      >
                        {/* Active: #FFC244 (yellow) | Inactive: #333333 */}
                        <Star 
                          size={36} 
                          fill={star <= rating ? "#FFC244" : "#333333"} 
                          className={`transition-all duration-200 ${
                            star <= rating 
                              ? "text-brand-primary drop-shadow-sm" 
                              : "text-[#333333]"
                          }`}
                          strokeWidth={star <= rating ? 0 : 1.5}
                        />
                      </MotionButton>
                    ))}
                  </div>

                  {/* Textarea: #0D0D0D bg | #FFFFFF text | #6B6B6B placeholder | #FFC244 focus */}
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Found a bug? Have a feature idea? Let us know..."
                    className="w-full bg-brand-background rounded-xl p-4 h-32 text-brand-text text-[15px] outline-none focus:ring-2 focus:ring-brand-primary/20 transition mb-4 resize-none border border-brand-divider focus:border-brand-primary/50 placeholder-brand-text-tertiary"
                  />

                  {/* Submit button: #7C3AED (purple) */}
                  <MotionButton
                    type="submit"
                    disabled={isSubmitting || (rating === 0 && !feedback.trim())}
                    whileTap={{ scale: isSubmitting || (rating === 0 && !feedback.trim()) ? 1 : 0.98 }}
                    className="w-full py-4 bg-brand-button-primary hover:bg-brand-button-primary-hover text-white font-bold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send size={18} strokeWidth={2} />
                        <span>Send Feedback</span>
                      </>
                    )}
                  </MotionButton>
                </form>
              </MotionDiv>
            )}
          </AnimatePresence>
        </MotionDiv>
      </MotionDiv>
    </AnimatePresence>
  );
};
