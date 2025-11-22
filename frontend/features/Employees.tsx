
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, Hash, Search, CalendarDays, User, ShieldCheck, Plus } from 'lucide-react';
import { GlassCard, NeonButton, SectionHeader, DecryptedText, StatusBadge } from '../components/ui';
import { IEmployee } from '../types';
import { getEmployees } from '../services/api';
import { EmployeeForm } from './EmployeeForm';
import { EmployeeContracts } from './EmployeeContracts';
import { EmployeeCompensation } from './EmployeeCompensation';
import { EmployeeAttendance } from './EmployeeAttendance';

interface EmployeesProps {
  onBack: () => void;
}

export const Employees: React.FC<EmployeesProps> = ({ onBack }) => {
  const [employees, setEmployees] = useState<IEmployee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<IEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<IEmployee | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');

  const loadEmployees = () => {
    setLoading(true);
    getEmployees().then((data) => {
      setEmployees(data);
      setFilteredEmployees(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadEmployees();
  }, []);

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
          <NeonButton onClick={() => setShowAddForm(true)} icon={Plus}>
            Add Employee
          </NeonButton>
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
            className="block w-full p-2 pl-8 text-sm font-mono bg-black/50 border border-neon-green/30 rounded-sm text-white focus:ring-1 focus:ring-neon-green focus:border-neon-green placeholder-gray-600"
            placeholder="SEARCH_QUERY_"
          />
          <Search className="absolute right-3 top-2.5 text-neon-green opacity-50" size={14} />
        </div>
      </div>

      <SectionHeader title="Personnel Directory" subtitle="Identity Chips" />

      {/* Grid of Employees */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredEmployees.map((emp) => (
          <GlassCard
            key={emp.id}
            hoverEffect
            onClick={() => setSelectedEmployee(emp)}
            className={`p-0 group relative border-t-4 ${getBorderColor(emp.status)}`}
          >
            <div className="p-6 flex flex-col items-center">
              <div className="relative w-24 h-24 mb-4">
                {/* Avatar Glow */}
                <div className={`absolute inset-0 rounded-full blur opacity-30 transition-opacity ${emp.status === 'Active' ? 'bg-neon-cyan' : emp.status === 'Terminated' ? 'bg-neon-red' : 'bg-yellow-500'}`} />
                <img src={emp.avatarUrl} alt={emp.firstName} className="relative w-24 h-24 rounded-full object-cover border-2 border-white/10 z-10" />
              </div>

              <h3 className="text-lg font-orbitron font-bold text-white">{emp.firstName} {emp.lastName}</h3>
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
          <div className="text-neon-cyan font-orbitron animate-pulse">LOADING PERSONNEL DATA...</div>
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
              className="w-full max-w-4xl bg-[#0a0a10] border border-neon-cyan/30 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,243,255,0.15)] relative flex flex-col md:flex-row max-h-[90vh] overflow-y-auto md:overflow-hidden"
            >
              {/* Left: Visuals & Basic Info */}
              <div className="md:w-1/3 p-8 bg-gradient-to-b from-neon-cyan/5 to-transparent border-r border-white/10 flex flex-col items-center text-center">
                <div className="w-40 h-40 rounded-full border-4 border-neon-cyan/30 p-1 mb-6 shadow-[0_0_20px_rgba(0,243,255,0.3)]">
                  <img src={selectedEmployee.avatarUrl} className="w-full h-full rounded-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
                </div>
                <h2 className="text-2xl font-orbitron font-bold text-white">{selectedEmployee.firstName} {selectedEmployee.lastName}</h2>
                <p className="text-neon-cyan font-mono text-sm mb-4">{selectedEmployee.id}</p>

                <StatusBadge status={selectedEmployee.status} />

                <div className="mt-6 w-full space-y-3 text-left">
                  <div className="flex items-center justify-between text-sm text-gray-400 border-b border-white/10 pb-2">
                    <span className="flex items-center gap-2"><Mail size={14} /> Email</span>
                    <span className="text-white text-xs">{selectedEmployee.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-400 border-b border-white/10 pb-2">
                    <span className="flex items-center gap-2"><Hash size={14} /> Phone</span>
                    <span className="text-white text-xs">{selectedEmployee.phoneNumber}</span>
                  </div>
                </div>
              </div>

              {/* Right: Detailed Specs with Tabs */}
              <div className="md:w-2/3 flex flex-col h-full bg-[#050505]">
                <div className="flex items-center justify-between p-4 border-b border-white/10">
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
                    CLOSE [X]
                  </button>
                </div>

                <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                  {activeTab === 'Overview' && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <h3 className="text-xl font-rajdhani font-bold text-neon-purple mb-6 flex items-center gap-2">
                        <ShieldCheck size={20} /> Clearance Data
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white/5 p-4 rounded border border-white/10">
                          <DecryptedText label="Current Salary (Protected)" value={selectedEmployee.currentSalary} />
                        </div>
                        <div className="bg-white/5 p-4 rounded border border-white/10">
                          <div className="text-[10px] font-mono text-gray-500 uppercase mb-1">Department</div>
                          <div className="text-white font-orbitron">{selectedEmployee.departmentId}</div>
                        </div>
                        <div className="bg-white/5 p-4 rounded border border-white/10">
                          <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase mb-1">
                            <User size={10} /> Reporting To
                          </div>
                          <div className="text-neon-cyan font-bold">{selectedEmployee.managerId || "N/A"}</div>
                        </div>
                        <div className="bg-white/5 p-4 rounded border border-white/10">
                          <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase mb-1">
                            <CalendarDays size={10} /> Hire Date
                          </div>
                          <div className="text-white">{selectedEmployee.hireDate}</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Skill Matrix</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedEmployee.skills.map(skill => (
                            <span key={skill} className="px-2 py-1 bg-neon-purple/10 border border-neon-purple/30 rounded text-xs text-neon-purple">
                              {skill}
                            </span>
                          ))}
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
                      <EmployeeContracts employeeId={parseInt(selectedEmployee.id)} />
                    </motion.div>
                  )}

                  {activeTab === 'Compensation' && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <EmployeeCompensation
                        employeeId={parseInt(selectedEmployee.id)}
                        currentSalary={selectedEmployee.currentSalary}
                      />
                    </motion.div>
                  )}

                  {activeTab === 'Attendance' && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <EmployeeAttendance employeeId={parseInt(selectedEmployee.id)} />
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
