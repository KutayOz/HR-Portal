import React, { useEffect, useState, useRef } from 'react';
import { Clock, Timer, X } from 'lucide-react';
import { IAccessRequest } from '../types';
import { getAccessOutbox } from '../services/api';

interface AccessTimerWidgetProps {
  onNewGrant?: (grants: IAccessRequest[]) => void;
}

// Use a module-level Set to persist seen IDs across re-renders and component remounts
const notifiedGrantIds = new Set<string>();

export const AccessTimerWidget: React.FC<AccessTimerWidgetProps> = ({ onNewGrant }) => {
  const [activeGrants, setActiveGrants] = useState<IAccessRequest[]>([]);
  const [expanded, setExpanded] = useState(false);
  const isFirstLoad = useRef(true);

  const loadGrants = async () => {
    try {
      const outbox = await getAccessOutbox();
      const now = Date.now();
      const active = outbox.filter(r => 
        r.status === 'Approved' && 
        r.allowedUntil && 
        new Date(r.allowedUntil).getTime() > now
      );
      
      // Only notify for truly new grants (not on first load, and not already notified)
      if (!isFirstLoad.current) {
        const newGrants = active.filter(g => !notifiedGrantIds.has(g.id));
        if (newGrants.length > 0) {
          onNewGrant?.(newGrants);
          newGrants.forEach(g => notifiedGrantIds.add(g.id));
        }
      } else {
        // On first load, mark all current grants as seen (don't notify)
        active.forEach(g => notifiedGrantIds.add(g.id));
        isFirstLoad.current = false;
      }
      
      setActiveGrants(active);
    } catch (error) {
      console.error('Failed to load access grants:', error);
    }
  };

  useEffect(() => {
    loadGrants();
    const interval = setInterval(loadGrants, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Countdown timer update
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimeRemaining = (allowedUntil: string) => {
    const remaining = new Date(allowedUntil).getTime() - Date.now();
    if (remaining <= 0) return 'Expired';
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    if (minutes > 60) {
      const hours = Math.floor(minutes / 60);
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTimeColor = (allowedUntil: string) => {
    const remaining = new Date(allowedUntil).getTime() - Date.now();
    if (remaining < 60000) return 'text-red-500'; // < 1 min
    if (remaining < 300000) return 'text-yellow-500'; // < 5 min
    return 'text-neon-green';
  };

  if (activeGrants.length === 0) return null;

  return (
    <div className="fixed bottom-16 right-4 z-50">
      {/* Collapsed View - Timer Badge */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-2 px-4 py-2 bg-black/90 border border-neon-cyan/50 rounded-full shadow-lg hover:border-neon-cyan transition-all hover:shadow-[0_0_15px_rgba(0,243,255,0.3)]"
        >
          <Timer size={16} className="text-neon-cyan animate-pulse" />
          <span className="text-white font-mono text-sm">{activeGrants.length} Active</span>
          <span className={`font-mono text-sm font-bold ${getTimeColor(activeGrants[0].allowedUntil!)}`}>
            {formatTimeRemaining(activeGrants[0].allowedUntil!)}
          </span>
        </button>
      )}

      {/* Expanded View - Full Timer List */}
      {expanded && (
        <div className="w-80 bg-black/95 border border-neon-cyan/30 rounded-lg shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-neon-cyan/5">
            <h3 className="text-sm font-orbitron text-neon-cyan flex items-center gap-2">
              <Clock size={14} /> Access Grants
            </h3>
            <button
              onClick={() => setExpanded(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {activeGrants.map((grant) => (
              <div
                key={grant.id}
                className="px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/5"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white text-sm font-medium truncate">
                    {grant.resourceType}
                  </span>
                  <span className={`font-mono text-sm font-bold ${getTimeColor(grant.allowedUntil!)}`}>
                    {formatTimeRemaining(grant.allowedUntil!)}
                  </span>
                </div>
                <div className="text-[10px] text-gray-500">
                  <span className="text-gray-400">{grant.resourceId}</span>
                  <span className="mx-2">•</span>
                  <span>from {grant.ownerAdminId}</span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      getTimeColor(grant.allowedUntil!) === 'text-red-500' ? 'bg-red-500' :
                      getTimeColor(grant.allowedUntil!) === 'text-yellow-500' ? 'bg-yellow-500' :
                      'bg-neon-green'
                    }`}
                    style={{
                      width: `${Math.max(0, Math.min(100, 
                        ((new Date(grant.allowedUntil!).getTime() - Date.now()) / (15 * 60000)) * 100
                      ))}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
