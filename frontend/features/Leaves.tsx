
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Plane, Laptop, Stethoscope, Plus, Search, UserX, Clock, CheckCircle, XCircle } from 'lucide-react';
import { GlassCard, NeonButton, SectionHeader } from '../components/ui';
import { getLeaves, getEmployees, getAttendanceRecordsByEmployee } from '../services/api';
import { ILeaveRequest, IEmployee, IAttendanceRecord } from '../types';
import { LeaveRequestForm } from './LeaveRequestForm';

interface LeavesProps {
  onBack: () => void;
}

export const Leaves: React.FC<LeavesProps> = ({ onBack }) => {
  const [leaves, setLeaves] = useState<ILeaveRequest[]>([]);
  const [inactiveEmployees, setInactiveEmployees] = useState<IEmployee[]>([]);
  const [todayAbsences, setTodayAbsences] = useState<(IAttendanceRecord & { employeeName?: string })[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [scope, setScope] = useState<'all' | 'yours'>('yours');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<'requests' | 'approved' | 'declined'>('requests');

  const filteredLeaves = leaves.filter(leave =>
    leave.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    leave.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    leave.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInactive = inactiveEmployees.filter(emp =>
    `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAbsences = todayAbsences.filter(att =>
    att.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    att.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Approved leave requests for the Approved section
  const approvedLeaves = leaves.filter(leave => leave.status === 'Approved');
  const filteredApprovedLeaves = approvedLeaves.filter(leave =>
    leave.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    leave.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Declined leave requests for the Declined section
  const declinedLeaves = leaves.filter(leave => leave.status === 'Declined' || leave.status === 'Rejected');
  const filteredDeclinedLeaves = declinedLeaves.filter(leave =>
    leave.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    leave.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pending requests count for badge
  const pendingCount = leaves.filter(l => l.status === 'Pending').length;
  const approvedCount = approvedLeaves.length + inactiveEmployees.length + todayAbsences.length;
  const declinedCount = declinedLeaves.length;

  const loadLeaves = () => {
    getLeaves(scope).then(setLeaves);
  };

  const loadInactiveEmployees = () => {
    getEmployees(scope).then(employees => {
      const inactive = employees.filter(emp => emp.status !== 'Active');
      setInactiveEmployees(inactive);
    });
  };

  const loadTodayAbsences = async () => {
    const employees = await getEmployees(scope);
    const today = new Date().toISOString().split('T')[0];
    const absences: (IAttendanceRecord & { employeeName?: string })[] = [];
    
    for (const emp of employees) {
      try {
        const records = await getAttendanceRecordsByEmployee(parseInt(emp.id.replace('E-', '')));
        const todayRecord = records.find(r => r.date === today && r.status !== 'Present');
        if (todayRecord) {
          absences.push({
            ...todayRecord,
            employeeName: `${emp.firstName} ${emp.lastName}`
          });
        }
      } catch {
        // Skip if no records
      }
    }
    setTodayAbsences(absences);
  };

  useEffect(() => {
    loadLeaves();
    loadInactiveEmployees();
    loadTodayAbsences();

    // Auto-refresh every 10 seconds to pick up simulated approvals
    const interval = setInterval(() => {
      loadLeaves();
      loadInactiveEmployees();
    }, 10000);

    return () => clearInterval(interval);
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
        {/* Section Tabs */}
        <div className="inline-flex rounded-lg border border-white/10 overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setActiveSection('requests')}
            className={`px-4 py-1.5 transition-colors flex items-center gap-2 ${activeSection === 'requests' ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <Calendar size={12} />
            Requests {pendingCount > 0 && <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-yellow-500/20 text-yellow-400 rounded-full">{pendingCount}</span>}
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('approved')}
            className={`px-4 py-1.5 transition-colors border-l border-white/10 flex items-center gap-2 ${activeSection === 'approved' ? 'bg-neon-green/20 text-neon-green' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <CheckCircle size={12} />
            Approved ({approvedCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('declined')}
            className={`px-4 py-1.5 transition-colors border-l border-white/10 flex items-center gap-2 ${activeSection === 'declined' ? 'bg-neon-red/20 text-neon-red' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <XCircle size={12} />
            Declined ({declinedCount})
          </button>
        </div>

        {/* Scope Toggle */}
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

      {activeSection === 'requests' && (
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
      )}

      {activeSection === 'approved' && (
      <GlassCard className="p-6">
          {filteredApprovedLeaves.length === 0 && filteredInactive.length === 0 && filteredAbsences.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-sm">
              No approved requests found.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Approved Leave Requests */}
              {filteredApprovedLeaves.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-neon-green mb-3 flex items-center gap-2">
                    <CheckCircle size={14} /> Approved Leave Requests ({filteredApprovedLeaves.length})
                  </h3>
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
                        {filteredApprovedLeaves.map((leave) => (
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
                              <span className="px-2 py-1 rounded-full text-[11px] font-mono border border-neon-green text-neon-green bg-neon-green/10">
                                Approved
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Today's Attendance Absences */}
              {filteredAbsences.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-neon-cyan mb-3 flex items-center gap-2">
                    <Clock size={14} /> Today's Attendance ({filteredAbsences.length})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-gray-400 text-xs uppercase">
                          <th className="text-left py-2 pr-4 font-normal">Employee</th>
                          <th className="text-left py-2 px-4 font-normal">Status</th>
                          <th className="text-left py-2 px-4 font-normal">Check In</th>
                          <th className="text-left py-2 px-4 font-normal">Check Out</th>
                          <th className="text-left py-2 px-4 font-normal">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAbsences.map((att) => (
                          <tr key={att.id} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                            <td className="py-2 pr-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center font-bold text-xs text-white border border-gray-600">
                                  {att.employeeName?.charAt(0) || '?'}
                                </div>
                                <div>
                                  <div className="text-white text-sm font-semibold">{att.employeeName}</div>
                                  <div className="text-[10px] text-gray-500">{att.employeeId}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-2 px-4">
                              <span
                                className={`px-2 py-1 rounded-full text-[11px] font-mono border ${
                                  att.status === 'Absent'
                                    ? 'border-neon-red text-neon-red bg-neon-red/10'
                                    : att.status === 'Late'
                                      ? 'border-yellow-400 text-yellow-400 bg-yellow-400/10'
                                      : 'border-gray-400 text-gray-400 bg-gray-400/10'
                                }`}
                              >
                                {att.status}
                              </span>
                            </td>
                            <td className="py-2 px-4 text-gray-200 text-xs">{att.checkInTime || '-'}</td>
                            <td className="py-2 px-4 text-gray-200 text-xs">{att.checkOutTime || '-'}</td>
                            <td className="py-2 px-4 text-gray-200 text-xs">{(att as any).remarks || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Inactive Employees */}
              {filteredInactive.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-neon-red mb-3 flex items-center gap-2">
                    <UserX size={14} /> Inactive Employees ({filteredInactive.length})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-gray-400 text-xs uppercase">
                          <th className="text-left py-2 pr-4 font-normal">Employee</th>
                          <th className="text-left py-2 px-4 font-normal">Position</th>
                          <th className="text-left py-2 px-4 font-normal">Status</th>
                          <th className="text-left py-2 px-4 font-normal">Hire Date</th>
                          <th className="text-left py-2 px-4 font-normal">Termination</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInactive.map((emp) => (
                          <tr key={emp.id} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                            <td className="py-2 pr-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center font-bold text-xs text-white border border-gray-600">
                                  {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                                </div>
                                <div>
                                  <div className="text-white text-sm font-semibold">{emp.firstName} {emp.lastName}</div>
                                  <div className="text-[10px] text-gray-500">{emp.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-2 px-4 text-gray-200 text-xs">{emp.jobTitle}</td>
                            <td className="py-2 px-4">
                              <span
                                className={`px-2 py-1 rounded-full text-[11px] font-mono border ${
                                  emp.status === 'Terminated'
                                    ? 'border-neon-red text-neon-red bg-neon-red/10'
                                    : emp.status === 'OnLeave'
                                      ? 'border-yellow-400 text-yellow-400 bg-yellow-400/10'
                                      : 'border-gray-400 text-gray-400 bg-gray-400/10'
                                }`}
                              >
                                {emp.status}
                              </span>
                            </td>
                            <td className="py-2 px-4 text-gray-200 text-xs">
                              {new Date(emp.hireDate).toLocaleDateString('en-US')}
                            </td>
                            <td className="py-2 px-4 text-gray-200 text-xs">
                              {emp.terminationDate ? new Date(emp.terminationDate).toLocaleDateString('en-US') : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
      </GlassCard>
      )}

      {activeSection === 'declined' && (
      <GlassCard className="p-6">
          {filteredDeclinedLeaves.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-sm">
              No declined requests found.
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-semibold text-neon-red mb-3 flex items-center gap-2">
                <XCircle size={14} /> Declined Leave Requests ({filteredDeclinedLeaves.length})
              </h3>
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
                    {filteredDeclinedLeaves.map((leave) => (
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
                          <span className="px-2 py-1 rounded-full text-[11px] font-mono border border-neon-red text-neon-red bg-neon-red/10">
                            Declined
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
      </GlassCard>
      )}
    </div>
  );
};
