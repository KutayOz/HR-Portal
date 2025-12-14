
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Plane, Laptop, Stethoscope, Plus, Search } from 'lucide-react';
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
  const [scope, setScope] = useState<'all' | 'yours'>('yours');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLeaves = leaves.filter(leave =>
    leave.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    leave.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    leave.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const loadLeaves = () => {
    getLeaves(scope).then(setLeaves);
  };

  useEffect(() => {
    loadLeaves();
  }, [scope]);

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
      
      <div className="flex items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <NeonButton onClick={onBack} variant="ghost" icon={ArrowLeft}>
            Back
          </NeonButton>
          <NeonButton
            onClick={() => {
              if (scope === 'all') {
                alert('Switch to "Yours" to create leave requests.');
                return;
              }
              setShowAddForm(true);
            }}
            icon={Plus}
          >
            New Request
          </NeonButton>
        </div>

        {/* Search Box */}
        <div className="relative w-64 md:w-96">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neon-cyan">
            <span className="font-mono text-sm">{'>'}</span>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full p-2 pl-8 text-sm font-mono bg-black/50 border border-neon-cyan/30 rounded-sm text-white focus:ring-1 focus:ring-neon-cyan focus:border-neon-cyan placeholder-gray-600"
            placeholder="SEARCH_REQUEST_"
          />
          <Search className="absolute right-3 top-2.5 text-neon-cyan opacity-50" size={14} />
        </div>
      </div>
      
      <SectionHeader title="Request Manager"/>

      <div className="flex items-center justify-between mb-4">
        <div className="text-xs text-gray-500 font-rajdhani uppercase tracking-[0.2em]">
          View
        </div>
        <div className="inline-flex rounded-lg border border-white/10 overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setScope('yours')}
            className={`px-3 py-1 transition-colors ${scope === 'yours' ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            Yours
          </button>
          <button
            type="button"
            onClick={() => setScope('all')}
            className={`px-3 py-1 transition-colors border-l border-white/10 ${scope === 'all' ? 'bg-neon-purple/20 text-neon-purple' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            All
          </button>
        </div>
      </div>

      <GlassCard className="p-6">
          {filteredLeaves.length === 0 ? (
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
                  {filteredLeaves.map((leave) => (
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
    </div>
  );
};
