
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, User, Fingerprint, ScanLine } from 'lucide-react';
import { GlassCard } from '../components/ui';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'scanning' | 'success'>('input');
  const [username, setUsername] = useState('admin01');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('scanning');
    setLoading(true);
    
    // Simulate Biometric Scan & Handshake
    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        try {
          localStorage.setItem('adminId', username);
        } catch {
        }
        onLogin();
      }, 800);
    }, 2000);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <GlassCard className="p-8 border-t-4 border-t-neon-cyan">
          {/* Header */}
          <div className="text-center mb-8 relative">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-black/50 border border-neon-cyan/30 flex items-center justify-center relative overflow-hidden">
               <AnimatePresence mode="wait">
                 {step === 'input' && <ShieldCheck className="text-neon-cyan w-10 h-10" />}
                 {step === 'scanning' && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 flex items-center justify-center text-neon-red"
                    >
                        <Fingerprint className="w-12 h-12 animate-pulse" />
                        <motion.div 
                            className="absolute w-full h-1 bg-neon-red/80 shadow-[0_0_10px_#ff003c]"
                            animate={{ top: ['0%', '100%', '0%'] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        />
                    </motion.div>
                 )}
                 {step === 'success' && <Lock className="text-neon-green w-10 h-10" />}
               </AnimatePresence>
            </div>
            
            <h1 className="text-2xl font-orbitron font-bold text-gray-900 dark:text-white tracking-widest">SYSTEM ACCESS</h1>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="group">
                <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1 tracking-wider">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={16} className="text-neon-cyan/60 group-focus-within:text-neon-cyan transition-colors" />
                  </div>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    className="block w-full pl-10 pr-3 py-2.5 bg-gray-100 dark:bg-black/40 border border-gray-300 dark:border-white/10 rounded text-sm text-gray-900 dark:text-white font-mono focus:ring-1 focus:ring-neon-cyan focus:border-neon-cyan placeholder-gray-400 dark:placeholder-gray-600 transition-all"
                    placeholder="ENTER ID..."
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1 tracking-wider">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={16} className="text-neon-cyan/60 group-focus-within:text-neon-cyan transition-colors" />
                  </div>
                  <input 
                    type="password" 
                    defaultValue="password"
                    disabled={loading}
                    className="block w-full pl-10 pr-3 py-2.5 bg-gray-100 dark:bg-black/40 border border-gray-300 dark:border-white/10 rounded text-sm text-gray-900 dark:text-white font-mono focus:ring-1 focus:ring-neon-cyan focus:border-neon-cyan placeholder-gray-400 dark:placeholder-gray-600 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {step === 'input' && (
                <motion.button
                    whileHover={{ scale: 1.02, textShadow: "0 0 8px rgb(0, 243, 255)" }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan font-rajdhani font-bold text-lg tracking-widest rounded uppercase transition-all shadow-[0_0_15px_rgba(0,243,255,0.1)] hover:shadow-[0_0_25px_rgba(0,243,255,0.3)]"
                >
                    Connect
                </motion.button>
            )}

            {step !== 'input' && (
                <div className="w-full py-3 bg-gray-100 dark:bg-black/40 border border-gray-300 dark:border-white/10 rounded flex items-center justify-center gap-2 text-xs font-mono text-gray-500 dark:text-gray-400">
                    {step === 'scanning' ? (
                        <>
                            <ScanLine className="animate-spin" size={14} />
                            <span>VERIFYING BIOMETRICS...</span>
                        </>
                    ) : (
                        <span className="text-neon-green">ACCESS GRANTED</span>
                    )}
                </div>
            )}
          </form>

          <div className="mt-8 flex justify-between items-center text-[10px] text-gray-600 font-mono">
             <span>V.2.0.49</span>
             <span>Made by Ahmet Kutay Özdemir</span>
          </div>
        </GlassCard>
      </motion.div>
      
      {/* Background Elements specific to login */}
      <div className="absolute inset-0 pointer-events-none z-0">
         <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-neon-cyan/10 to-transparent" />
         <div className="absolute top-0 left-1/2 h-full w-[1px] bg-gradient-to-b from-transparent via-neon-purple/10 to-transparent" />
      </div>
    </div>
  );
};
