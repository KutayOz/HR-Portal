
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, Lock } from 'lucide-react';

// --- Glass Card ---
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', hoverEffect = false, onClick }) => {
  return (
    <motion.div
      whileHover={hoverEffect ? { scale: 1.01, boxShadow: '0 0 25px rgba(0, 243, 255, 0.15)' } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-xl 
        bg-neon-glass backdrop-blur-xl 
        border border-white/10 
        ${hoverEffect ? 'cursor-pointer hover:border-neon-cyan/50' : ''}
        ${className}
      `}
    >
      {/* Scanline overlay effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-0 pointer-events-none bg-[length:100%_2px,3px_100%]" />
      
      <div className="relative z-10 h-full">
        {children}
      </div>
    </motion.div>
  );
};

// --- Neon Button ---
interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'ghost';
  icon?: LucideIcon;
}

export const NeonButton: React.FC<NeonButtonProps> = ({ children, variant = 'primary', icon: Icon, className = '', ...props }) => {
  const variants = {
    primary: 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/50 hover:bg-neon-cyan/20 hover:shadow-[0_0_15px_rgba(0,243,255,0.4)]',
    danger: 'bg-neon-red/10 text-neon-red border-neon-red/50 hover:bg-neon-red/20 hover:shadow-[0_0_15px_rgba(255,0,60,0.4)]',
    ghost: 'bg-transparent text-white/70 border-transparent hover:text-white hover:bg-white/5',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      className={`
        flex items-center justify-center gap-2 px-6 py-2 rounded-lg 
        font-rajdhani font-bold uppercase tracking-wider border transition-all duration-300
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {Icon && <Icon size={18} />}
      {children}
    </motion.button>
  );
};

// --- Section Header ---
export const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="mb-8">
    <motion.h2 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="text-4xl font-orbitron font-bold text-white tracking-widest uppercase"
    >
      {title} <span className="text-neon-cyan">.</span>
    </motion.h2>
    {subtitle && (
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-neon-cyan/60 font-rajdhani tracking-wide mt-1"
      >
        // {subtitle}
      </motion.p>
    )}
  </div>
);

// --- Decrypted Text (Financial Protection) ---
export const DecryptedText: React.FC<{ value: string | number; label?: string }> = ({ value, label }) => {
    const [revealed, setRevealed] = useState(false);
    const [displayValue, setDisplayValue] = useState("******");
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&";

    const handleDecrypt = () => {
        if (revealed) return;
        let iterations = 0;
        const interval = setInterval(() => {
            setDisplayValue(prev => 
                prev.split("").map(() => characters[Math.floor(Math.random() * characters.length)]).join("")
            );
            iterations++;
            if (iterations > 10) {
                clearInterval(interval);
                setDisplayValue(typeof value === 'number' ? value.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : value);
                setRevealed(true);
            }
        }, 50);
    };

    return (
        <div className="flex flex-col gap-1">
            {label && <span className="text-[10px] font-mono text-gray-500 uppercase">{label}</span>}
            <div 
                onClick={handleDecrypt}
                className={`font-mono text-lg cursor-pointer select-none flex items-center gap-2 ${revealed ? 'text-neon-green' : 'text-neon-red animate-pulse'}`}
            >
                {!revealed && <Lock size={14} />}
                {displayValue}
            </div>
        </div>
    );
}

// --- Status Badge ---
export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const styles: Record<string, string> = {
        Active: 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30',
        Terminated: 'bg-neon-red/10 text-neon-red border-neon-red/30',
        OnLeave: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
        Approved: 'bg-neon-green/10 text-neon-green border-neon-green/30',
        Pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
        Rejected: 'bg-neon-red/10 text-neon-red border-neon-red/30',
    };
    
    const defaultStyle = 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-orbitron uppercase tracking-wider border ${styles[status] || defaultStyle}`}>
            {status}
        </span>
    );
}

// --- News Ticker ---
export const NeonTicker: React.FC<{ items: any[] }> = ({ items }) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 h-8 bg-black border-t border-neon-cyan/30 flex items-center overflow-hidden z-50">
            <div className="bg-neon-cyan/20 h-full px-4 flex items-center text-xs font-bold text-neon-cyan border-r border-neon-cyan/30 z-10">
                SYSTEM INTEL
            </div>
            <motion.div 
                className="flex items-center gap-16 whitespace-nowrap"
                animate={{ x: ["100%", "-100%"] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
                {items.map((item) => (
                    <div key={item.id} className={`flex items-center gap-2 text-xs font-mono ${item.priority === 'Critical' ? 'text-neon-red' : 'text-gray-300'}`}>
                        {item.priority === 'Critical' && <span className="animate-ping w-2 h-2 bg-neon-red rounded-full" />}
                        <span className="opacity-50">[{item.priority.toUpperCase()}]</span>
                        <span className="font-bold">{item.title}:</span>
                        <span>{item.content}</span>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
