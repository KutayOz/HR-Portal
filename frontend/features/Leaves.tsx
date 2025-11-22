
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Plane, Laptop, Stethoscope, Plus } from 'lucide-react';
import { GlassCard, NeonButton, SectionHeader } from '../components/ui';
import { getLeaves } from '../services/api';
import { ILeaveRequest } from '../types';
import { LeaveRequestForm } from './LeaveRequestForm';

interface LeavesProps {
  onBack: () => void;
}

export const Leaves: React.FC<LeavesProps> = ({ onBack }) => {
  const [leaves, setLeaves] = useState<ILeaveRequest[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const days = Array.from({ length: 30 }, (_, i) => i + 1); // 30 days simulation

  const loadLeaves = () => {
    getLeaves().then(setLeaves);
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  const getLeaveIcon = (type: string) => {
    switch (type) {
      case 'Annual': return <Plane size={14} />;
      case 'Sick': return <Stethoscope size={14} />;
      case 'Remote': return <Laptop size={14} />;
      default: return <Calendar size={14} />;
    }
  };

  const getLeaveColor = (type: string) => {
    switch (type) {
      case 'Annual': return 'bg-neon-purple text-white border-neon-purple';
      case 'Sick': return 'bg-neon-red text-white border-neon-red';
      case 'Remote': return 'bg-neon-cyan text-black border-neon-cyan';
      default: return 'bg-gray-600 text-white';
    }
  };

  return (
    <div className="min-h-[80vh]">
      <LeaveRequestForm 
        isOpen={showAddForm} 
        onClose={() => setShowAddForm(false)} 
        onSuccess={loadLeaves}
      />
      
      <div className="flex items-center justify-between mb-8">
        <NeonButton onClick={onBack} variant="ghost" icon={ArrowLeft}>
          Back
        </NeonButton>
        <NeonButton onClick={() => setShowAddForm(true)} icon={Plus}>
          New Leave Request
        </NeonButton>
      </div>
      
      <SectionHeader title="Temporal Flux" subtitle="Leave Management" />

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs text-gray-500 font-rajdhani uppercase tracking-[0.2em]">
          View Mode
        </div>
        <div className="inline-flex rounded-lg border border-white/10 overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 transition-colors ${viewMode === 'list' ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1 transition-colors border-l border-white/10 ${viewMode === 'timeline' ? 'bg-neon-purple/20 text-neon-purple' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            Timeline
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <GlassCard className="p-6">
          {leaves.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-sm">
              No leave requests yet. Use the "New Leave Request" button above to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 text-xs uppercase">
                    <th className="text-left py-2 pr-4 font-normal">Employee</th>
                    <th className="text-left py-2 px-4 font-normal">Type</th>
                    <th className="text-left py-2 px-4 font-normal">Period</th>
                    <th className="text-left py-2 px-4 font-normal">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((leave) => (
                    <tr key={leave.id} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center font-bold text-xs text-white border border-gray-600">
                            {leave.employeeName.charAt(0)}
                          </div>
                          <div>
                            <div className="text-white text-sm font-semibold">{leave.employeeName}</div>
                            <div className="text-[10px] text-gray-500">{leave.employeeId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-mono border ${getLeaveColor(leave.type)}`}>
                          {getLeaveIcon(leave.type)}
                          <span>{leave.type}</span>
                        </span>
                      </td>
                      <td className="py-2 px-4 text-gray-200 text-xs">
                        {leave.startDate} → {leave.endDate}
                      </td>
                      <td className="py-2 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-[11px] font-mono border ${
                            leave.status === 'Approved'
                              ? 'border-neon-green text-neon-green bg-neon-green/10'
                              : leave.status === 'Rejected'
                                ? 'border-neon-red text-neon-red bg-neon-red/10'
                                : 'border-yellow-400 text-yellow-400 bg-yellow-400/10'
                          }`}
                        >
                          {leave.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      ) : (
        <GlassCard className="p-8 overflow-hidden relative">
          <h3 className="text-neon-cyan font-rajdhani font-bold mb-6 tracking-widest uppercase">October 2049</h3>
          
          <div className="overflow-x-auto pb-8 custom-scrollbar">
            <div className="min-w-[1200px]">
              
              {/* Date Header */}
              <div className="grid grid-cols-[200px_1fr] gap-4 mb-4 border-b border-white/10 pb-4">
                <div className="text-gray-500 font-mono text-xs uppercase pt-2">Employee ID</div>
                <div className="grid grid-cols-30 gap-1">
                  {days.map(d => (
                    <div key={d} className="text-center text-[10px] text-gray-500 font-mono">
                      {d}
                    </div>
                  ))}
                </div>
              </div>

              {/* Rows */}
              <div className="space-y-6">
                {leaves.map((leave, idx) => (
                  <motion.div 
                    key={leave.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="grid grid-cols-[200px_1fr] gap-4 items-center group hover:bg-white/5 rounded-lg p-2 transition-colors"
                  >
                    {/* Employee Info */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center font-bold text-xs text-white border border-gray-600">
                        {leave.employeeName.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs text-white font-bold">{leave.employeeName}</div>
                        <div className="text-[10px] text-gray-500">{leave.employeeId}</div>
                      </div>
                    </div>

                    {/* Timeline Bar */}
                    <div className="relative h-8 bg-white/5 rounded-full w-full">
                      {/* Grid Lines for reference */}
                      <div className="absolute inset-0 grid grid-cols-30 gap-1 pointer-events-none">
                        {days.map(d => (
                          <div key={d} className="border-r border-white/5 h-full last:border-0" />
                        ))}
                      </div>

                      {/* The Leave Bar */}
                      <motion.div
                        layoutId={`leave-${leave.id}`}
                        className={`absolute top-1 bottom-1 rounded-full flex items-center justify-center gap-2 text-[10px] font-bold shadow-lg border ${getLeaveColor(leave.type)}`}
                        style={{ 
                          // Simulating positions based on mock data dates (just hardcoded logic for visual demo)
                          left: `${(parseInt(leave.startDate.split('-')[2]) / 30) * 100}%`,
                          width: `${((parseInt(leave.endDate.split('-')[2]) - parseInt(leave.startDate.split('-')[2])) / 30) * 100}%`
                        }}
                      >
                        <span className="hidden lg:inline truncate px-2">{leave.type.toUpperCase()}</span>
                        {getLeaveIcon(leave.type)}
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-6 mt-8 pt-4 border-t border-white/10 justify-end">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-3 h-3 rounded-full bg-neon-purple"></div> Annual
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-3 h-3 rounded-full bg-neon-red"></div> Sick
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-3 h-3 rounded-full bg-neon-cyan"></div> Remote
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
