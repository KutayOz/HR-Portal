import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, Hash, Search, CalendarDays, User, ShieldCheck, Plus, Hexagon, Trash2 } from 'lucide-react';
import { GlassCard, NeonButton, SectionHeader, DecryptedText, StatusBadge } from '../components/ui';
import { IEmployee } from '../types';
import { createAccessRequest, getAccessOutbox, getEmployees, deleteEmployee } from '../services/api';
import { EmployeeForm } from './EmployeeForm';
import { EmployeeContracts } from './EmployeeContracts';
import { EmployeeCompensation } from './EmployeeCompensation';
import { EmployeeAttendance } from './EmployeeAttendance';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

// Performance elements for hexagon chart
const PERFORMANCE_ELEMENTS = [
  { key: 'technical', label: 'Technical', fullLabel: 'Technical Skills' },
  { key: 'communication', label: 'Communication', fullLabel: 'Communication' },
  { key: 'leadership', label: 'Leadership', fullLabel: 'Leadership' },
  { key: 'problemSolving', label: 'Problem Solving', fullLabel: 'Problem Solving' },
  { key: 'teamwork', label: 'Teamwork', fullLabel: 'Teamwork' },
  { key: 'adaptability', label: 'Adaptability', fullLabel: 'Adaptability' },
];

// Get color based on performance value (red to green gradient)
const getPerformanceColor = (value: number): string => {
  if (value >= 90) return '#22c55e'; // green-500
  if (value >= 80) return '#4ade80'; // green-400
  if (value >= 70) return '#86efac'; // green-300
  if (value >= 60) return '#fde047'; // yellow-300
  if (value >= 50) return '#fb923c'; // orange-400
  if (value >= 40) return '#f87171'; // red-400
  return '#dc2626'; // red-600
};

// Generate random but consistent performance stats for each employee
const getPerformanceStats = (employeeId: string) => {
  const seed = employeeId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return PERFORMANCE_ELEMENTS.map((element, index) => {
    const baseValue = ((seed * (index + 1) * 7) % 40) + 60; // 60-100 range
    return {
      subject: element.label,
      fullLabel: element.fullLabel,
      value: Math.min(100, baseValue),
      fullMark: 100,
    };
  });
};

interface EmployeesProps {
  onBack: () => void;
}

export const Employees: React.FC<EmployeesProps> = ({ onBack }) => {
  const [employees, setEmployees] = useState<IEmployee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<IEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<IEmployee | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [scope, setScope] = useState<'all' | 'yours'>('yours');
  const [employeeAccessAllowed, setEmployeeAccessAllowed] = useState(false);

  const loadRequestIdRef = useRef(0);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getErrorMessage = (error: unknown): string => {
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as any).message);
    }
    return 'Unexpected error';
  };

  const getAdminId = (): string | null => {
    try {
      return localStorage.getItem('adminId');
    } catch {
      return null;
    }
  };

  const refreshEmployeeAccess = async () => {
    const adminId = getAdminId();
    if (scope !== 'all' || !selectedEmployee || !adminId) {
      setEmployeeAccessAllowed(false);
      return;
    }

    if (selectedEmployee.ownerAdminId && selectedEmployee.ownerAdminId === adminId) {
      setEmployeeAccessAllowed(false);
      return;
    }

    const outbox = await getAccessOutbox();
    const now = Date.now();
    const allowed = outbox.some(r =>
      r.resourceType === 'Employee' &&
      r.resourceId === selectedEmployee.id &&
      r.status === 'Approved' &&
      r.allowedUntil &&
      new Date(r.allowedUntil).getTime() > now);

    setEmployeeAccessAllowed(allowed);
  };

  const requestEmployeeAccess = async () => {
    if (!selectedEmployee) return;

    const adminId = getAdminId();
    if (!adminId) {
      alert('Missing admin id. Please login again.');
      return;
    }

    if (selectedEmployee.ownerAdminId && selectedEmployee.ownerAdminId === adminId) {
      alert('Switch to "Yours" to edit your own employees.');
      return;
    }

    try {
      await createAccessRequest('Employee', selectedEmployee.id, `${adminId} wants access to your Employee`);
      await refreshEmployeeAccess();
      if (!employeeAccessAllowed) {
        alert('Access request sent to the responsible admin.');
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to send access request');
    }
  };

  const loadEmployees = () => {
    const requestId = ++loadRequestIdRef.current;
    setLoadError(null);
    setLoading(true);

    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }

    loadTimeoutRef.current = setTimeout(() => {
      if (loadRequestIdRef.current !== requestId) return;
      console.error('Employees load timed out');
      loadTimeoutRef.current = null;
      setLoading(false);
    }, 12000);

    getEmployees(scope)
      .then((data) => {
        if (loadRequestIdRef.current !== requestId) return;
        setEmployees(data);
        setFilteredEmployees(data);
        setLoadError(null);
      })
      .catch((error) => {
        if (loadRequestIdRef.current !== requestId) return;
        console.error('Failed to load employees:', error);
        setLoadError(getErrorMessage(error));
      })
      .finally(() => {
        if (loadRequestIdRef.current !== requestId) return;
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current);
          loadTimeoutRef.current = null;
        }
        setLoading(false);
      });
  };

  const cancelLoading = () => {
    loadRequestIdRef.current += 1;
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
    setLoading(false);
  };

  useEffect(() => {
    return () => {
      loadRequestIdRef.current += 1;
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    };
  }, []);

  const handleDeleteEmployee = async (emp: IEmployee, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm(`Are you sure you want to delete ${emp.firstName} ${emp.lastName}? This action cannot be undone.`)) {
      return;
    }
    try {
      await deleteEmployee(emp.id);
      setSelectedEmployee(null);
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(emp.id);
        return next;
      });
      loadEmployees();
    } catch (error) {
      console.error('Failed to delete employee:', error);
      alert(getErrorMessage(error));
    }
  };

  const toggleSelection = (empId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(empId)) {
        next.delete(empId);
      } else {
        next.add(empId);
      }
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} employee(s)? This action cannot be undone.`)) {
      return;
    }
    try {
      const ids = Array.from(selectedIds);
      const results = await Promise.allSettled(ids.map(id => deleteEmployee(id)));

      const succeededIds: string[] = [];
      const failed: Array<{ id: string; message: string }> = [];

      results.forEach((result, index) => {
        const id = ids[index];
        if (result.status === 'fulfilled') {
          succeededIds.push(id);
        } else {
          failed.push({ id, message: getErrorMessage(result.reason) });
        }
      });

      setSelectedIds(prev => {
        const next = new Set(prev);
        succeededIds.forEach(id => next.delete(id));
        return next;
      });

      if (failed.length === 0) {
        alert(`Deleted ${succeededIds.length} employee(s).`);
      } else {
        console.error('Bulk delete failures:', failed);
        alert(`Deleted ${succeededIds.length} employee(s). Failed ${failed.length}.`);
      }
      loadEmployees();
    } catch (error) {
      console.error('Failed to delete employees:', error);
      alert(getErrorMessage(error));
      loadEmployees();
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [scope]);

  useEffect(() => {
    if (!selectedEmployee) {
      setEmployeeAccessAllowed(false);
      return;
    }
    refreshEmployeeAccess();
  }, [selectedEmployee, scope]);

  useEffect(() => {
    const lowerQuery = searchQuery.toLowerCase();
    setFilteredEmployees(employees.filter(e =>
      e.firstName.toLowerCase().includes(lowerQuery) ||
      e.lastName.toLowerCase().includes(lowerQuery) ||
      e.jobTitle.toLowerCase().includes(lowerQuery) ||
      e.skills.some(s => s.toLowerCase().includes(lowerQuery))
    ));
  }, [searchQuery, employees]);

  const getBorderColor = (status: string) => {
    switch (status) {
      case 'Active': return 'border-neon-cyan/50 group-hover:border-neon-cyan';
      case 'OnLeave': return 'border-yellow-500/50 group-hover:border-yellow-500';
      case 'Terminated': return 'border-neon-red/50 group-hover:border-neon-red';
      default: return 'border-white/10';
    }
  };

  return (
    <div className="relative min-h-[80vh]">
      <EmployeeForm
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSuccess={loadEmployees}
      />

      <div className="flex items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <NeonButton onClick={onBack} variant="ghost" icon={ArrowLeft}>
            Back
          </NeonButton>
          <NeonButton
            onClick={() => {
              if (scope === 'all') {
                alert('Switch to "Yours" to create employees.');
                return;
              }
              setShowAddForm(true);
            }}
            icon={Plus}
          >
            Add Employee
          </NeonButton>
          {scope === 'yours' && selectedIds.size > 0 && (
            <NeonButton
              onClick={handleBulkDelete}
              variant="ghost"
              icon={Trash2}
              className="!text-red-500 !border-red-500/30 hover:!bg-red-500/10"
            >
              Delete ({selectedIds.size})
            </NeonButton>
          )}
        </div>

        <div className="inline-flex rounded-lg border border-gray-300 dark:border-white/10 overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setScope('yours')}
            className={`px-3 py-1 transition-colors ${scope === 'yours' ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'}`}
          >
            Yours
          </button>
          <button
            type="button"
            onClick={() => setScope('all')}
            className={`px-3 py-1 transition-colors border-l border-gray-300 dark:border-white/10 ${scope === 'all' ? 'bg-neon-purple/20 text-neon-purple' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'}`}
          >
            All
          </button>
        </div>

        {/* Command Line Search */}
        <div className="relative w-64 md:w-96">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neon-green">
            <span className="font-mono text-sm">{'>'}</span>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full p-2 pl-8 text-sm font-mono bg-gray-100 dark:bg-black/50 border border-neon-green/30 rounded-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-neon-green focus:border-neon-green placeholder-gray-400 dark:placeholder-gray-600"
            placeholder="SEARCH_QUERY_"
          />
          <Search className="absolute right-3 top-2.5 text-neon-green opacity-50" size={14} />
        </div>
      </div>

      <SectionHeader title="Personnel Directory"/>

      {loadError && (
        <div className="mb-6 bg-neon-red/10 border border-neon-red/30 text-neon-red px-4 py-3 rounded-lg flex items-center justify-between gap-4">
          <span className="text-sm font-mono break-words">{loadError}</span>
          <NeonButton onClick={loadEmployees} variant="ghost">
            Retry
          </NeonButton>
        </div>
      )}

      {/* Grid of Employees */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredEmployees.map((emp) => (
          <GlassCard
            key={emp.id}
            hoverEffect
            onClick={() => setSelectedEmployee(emp)}
            className={`p-0 group relative border-t-4 ${getBorderColor(emp.status)} ${selectedIds.has(emp.id) ? 'ring-2 ring-neon-cyan' : ''}`}
          >
            {/* Selection Checkbox (top-left) & Delete Button (top-right) */}
            {scope === 'yours' && (
              <div className="absolute top-2 left-2 right-2 flex justify-between z-20">
                <button
                  onClick={(e) => toggleSelection(emp.id, e)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    selectedIds.has(emp.id) 
                      ? 'bg-neon-cyan border-neon-cyan text-black' 
                      : 'border-white/30 hover:border-neon-cyan bg-black/50'
                  }`}
                >
                  {selectedIds.has(emp.id) && <span className="text-xs font-bold">✓</span>}
                </button>
                <button
                  onClick={(e) => handleDeleteEmployee(emp, e)}
                  className="w-5 h-5 rounded bg-black/50 border border-white/20 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-500 transition-all"
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}
            <div className="p-6 flex flex-col items-center">
              <div className="relative w-24 h-24 mb-4">
                {/* Avatar Glow */}
                <div className={`absolute inset-0 rounded-full blur opacity-30 transition-opacity ${emp.status === 'Active' ? 'bg-neon-cyan' : emp.status === 'Terminated' ? 'bg-neon-red' : 'bg-yellow-500'}`} />
                <img src={emp.avatarUrl} alt={emp.firstName} className="relative w-24 h-24 rounded-full object-cover border-2 border-white/10 z-10" />
              </div>

              <h3 className="text-lg font-orbitron font-bold text-gray-900 dark:text-white">{emp.firstName} {emp.lastName}</h3>
              <p className="text-neon-purple font-rajdhani font-semibold mb-2">{emp.jobTitle}</p>

              <div className="flex gap-2">
                <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded text-gray-400 font-mono">{emp.departmentId}</span>
                <StatusBadge status={emp.status} />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-40">
          <div className="flex flex-col items-center gap-4">
            <div className="text-neon-cyan font-orbitron animate-pulse">LOADING PERSONNEL DATA...</div>
            <NeonButton onClick={cancelLoading} variant="ghost">
              Cancel
            </NeonButton>
          </div>
        </div>
      )}

      {/* Detail Modal (Full Screen Overlay) */}
      <AnimatePresence>
        {selectedEmployee && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={() => setSelectedEmployee(null)}
          >
            <motion.div
              layoutId={`card-${selectedEmployee.id}`}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-5xl bg-white dark:bg-[#0a0a10] border border-gray-200 dark:border-neon-cyan/30 rounded-2xl overflow-hidden shadow-xl dark:shadow-[0_0_50px_rgba(0,243,255,0.15)] relative flex flex-col md:flex-row h-[600px] max-h-[92vh] overflow-y-auto md:overflow-hidden"
            >
              {/* Left: Visuals & Basic Info */}
              <div className="md:w-1/3 p-8 bg-gradient-to-b from-neon-cyan/5 to-transparent border-r border-white/10 flex flex-col items-center text-center">
                <div className="w-40 h-40 rounded-full border-4 border-neon-cyan/30 p-1 mb-6 shadow-[0_0_20px_rgba(0,243,255,0.3)]">
                  <img src={selectedEmployee.avatarUrl} className="w-full h-full rounded-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
                </div>
                <h2 className="text-2xl font-orbitron font-bold text-gray-900 dark:text-white">{selectedEmployee.firstName} {selectedEmployee.lastName}</h2>
                <p className="text-neon-cyan font-mono text-sm mb-4">{selectedEmployee.id}</p>

                <StatusBadge status={selectedEmployee.status} />

                <div className="mt-6 w-full space-y-3 text-left">
                  <div className="flex items-center justify-between text-sm text-gray-400 border-b border-white/10 pb-2">
                    <span className="flex items-center gap-2"><Mail size={14} /> Email</span>
                    <span className="text-gray-900 dark:text-white text-xs">{selectedEmployee.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-400 border-b border-white/10 pb-2">
                    <span className="flex items-center gap-2"><Hash size={14} /> Phone</span>
                    <span className="text-gray-900 dark:text-white text-xs">{selectedEmployee.phoneNumber}</span>
                  </div>
                </div>
              </div>

              {/* Right: Detailed Specs with Tabs */}
              <div className="md:w-2/3 flex flex-col h-full bg-gray-50 dark:bg-[#050505]">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10">
                  <div className="flex gap-4">
                    {['Overview', 'Contracts', 'Compensation', 'Attendance'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`text-sm font-orbitron tracking-wider pb-1 border-b-2 transition-colors ${activeTab === tab
                          ? 'text-neon-cyan border-neon-cyan'
                          : 'text-gray-500 border-transparent hover:text-gray-300'
                          }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setSelectedEmployee(null)}
                    className="text-gray-500 hover:text-white"
                  >
                    X
                  </button>
                </div>

                <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                  {activeTab === 'Overview' && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-gray-100 dark:bg-white/5 p-4 rounded border border-gray-200 dark:border-white/10">
                          <DecryptedText label="Current Salary" value={selectedEmployee.currentSalary} />
                        </div>
                        <div className="bg-gray-100 dark:bg-white/5 p-4 rounded border border-gray-200 dark:border-white/10">
                          <div className="text-[10px] font-mono text-gray-500 uppercase mb-1">Department</div>
                          <div className="text-gray-900 dark:text-white font-orbitron">{selectedEmployee.departmentId}</div>
                        </div>
                        <div className="bg-gray-100 dark:bg-white/5 p-4 rounded border border-gray-200 dark:border-white/10">
                          <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase mb-1">
                            <User size={10} /> Reporting To
                          </div>
                          <div className="text-neon-cyan font-bold">{selectedEmployee.managerId || "N/A"}</div>
                        </div>
                        <div className="bg-gray-100 dark:bg-white/5 p-4 rounded border border-gray-200 dark:border-white/10">
                          <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase mb-1">
                            <CalendarDays size={10} /> Hire Date
                          </div>
                          <div className="text-gray-900 dark:text-white">{selectedEmployee.hireDate}</div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-rajdhani font-bold text-neon-cyan flex items-center gap-2">
                            <Hexagon size={16} /> AI Performance Analysis
                          </h3>
                        </div>
                        
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <ResponsiveContainer width="100%" height={200}>
                              <RadarChart data={getPerformanceStats(selectedEmployee.id)} cx="50%" cy="50%" outerRadius="75%">
                                <PolarGrid stroke="#374151" />
                                <PolarAngleAxis 
                                  dataKey="subject" 
                                  tick={{ fill: '#9ca3af', fontSize: 10, fontFamily: 'Rajdhani' }}
                                />
                                <PolarRadiusAxis 
                                  angle={30} 
                                  domain={[0, 100]} 
                                  tick={false}
                                  axisLine={false}
                                />
                                <Radar
                                  name="Performance"
                                  dataKey="value"
                                  stroke="#00f0ff"
                                  fill="#00f0ff"
                                  fillOpacity={0.3}
                                  strokeWidth={2}
                                />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 content-center">
                            {getPerformanceStats(selectedEmployee.id).map((stat) => (
                              <div key={stat.subject} className="bg-white/5 rounded px-3 py-2 text-center border border-white/10 min-w-[100px]">
                                <div className="text-[10px] text-gray-500">{stat.fullLabel}</div>
                                <div 
                                  className="text-lg font-mono font-bold"
                                  style={{ color: getPerformanceColor(stat.value) }}
                                >
                                  {stat.value}%
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'Contracts' && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <EmployeeContracts
                        employeeId={parseInt(selectedEmployee.id.replace('E-', ''))}
                        readOnly={scope === 'all' && !employeeAccessAllowed}
                        readOnlyReason={scope === 'all' && selectedEmployee.ownerAdminId === getAdminId() ? 'switch' : 'request'}
                        onRequestAccess={requestEmployeeAccess}
                      />
                    </motion.div>
                  )}

                  {activeTab === 'Compensation' && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <EmployeeCompensation
                        employeeId={parseInt(selectedEmployee.id.replace('E-', ''))}
                        currentSalary={selectedEmployee.currentSalary}
                        readOnly={scope === 'all' && !employeeAccessAllowed}
                        readOnlyReason={scope === 'all' && selectedEmployee.ownerAdminId === getAdminId() ? 'switch' : 'request'}
                        onRequestAccess={requestEmployeeAccess}
                      />
                    </motion.div>
                  )}

                  {activeTab === 'Attendance' && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <EmployeeAttendance
                        employeeId={parseInt(selectedEmployee.id.replace('E-', ''))}
                        readOnly={scope === 'all' && !employeeAccessAllowed}
                        readOnlyReason={scope === 'all' && selectedEmployee.ownerAdminId === getAdminId() ? 'switch' : 'request'}
                        onRequestAccess={requestEmployeeAccess}
                      />
                    </motion.div>
                  )}
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
