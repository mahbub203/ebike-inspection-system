import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, LogIn, UserPlus, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SplashScreenProps {
  onDismiss: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onDismiss }) => {
  const { user, setShowAuthModal, setAuthMode } = useAuth();

  const handleStartLogin = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAuthMode('login');
    setShowAuthModal(true);
    onDismiss();
  };

  const handleStartRegister = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAuthMode('register');
    setShowAuthModal(true);
    onDismiss();
  };

  const handleDirectEnter = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onDismiss();
  };

  return (
    <div 
      onClick={handleDirectEnter}
      className="fixed inset-0 z-50 bg-[#101214] text-white flex flex-col items-center justify-between overflow-hidden select-none cursor-pointer"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#101214] via-[#0D0F11] to-[#0A0B0D] pointer-events-none" />

      {/* Center Phone Container matching the uploaded screenshot */}
      <div className="relative z-10 w-full h-full max-w-md flex flex-col justify-between items-center py-4 px-3 sm:px-6">
        
        {/* Top subtle fleet online indicator */}
        <div className="w-full flex items-center justify-between pt-2 px-2 z-20">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">
              Glafit Bangladesh
            </span>
          </div>

          <button
            onClick={handleDirectEnter}
            className="text-[11px] text-slate-400 hover:text-white px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 transition border border-white/10 flex items-center gap-1"
          >
            <span>Skip</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* The Exact Screenshot Artwork */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative w-full flex-1 flex items-center justify-center my-auto overflow-hidden pointer-events-none"
        >
          <img
            src="/assets/glafit-splash-exact.png"
            alt="GLAFIT Energy-Sharing Ecosystem"
            className="w-full max-h-[82vh] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
          />
        </motion.div>

        {/* Action Controls at Bottom */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="w-full space-y-2.5 pb-4 z-20 pointer-events-auto"
        >
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleStartLogin}
              className="py-3 px-4 rounded-xl bg-[#1677FF] hover:bg-blue-600 text-white font-semibold text-xs tracking-wide shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={handleStartRegister}
              className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs tracking-wide border border-white/15 transition flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleDirectEnter}
            className="w-full py-2.5 text-center text-xs text-slate-400 hover:text-white transition flex items-center justify-center gap-1.5"
          >
            <span>Enter as Guest / Explore Fleet</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      </div>
    </div>
  );
};
