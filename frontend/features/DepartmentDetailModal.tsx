import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Modal } from '../components/Modal';
import { IDepartment, IEmployee, IJobApplication } from '../types';
import { getEmployees, getApplications } from '../services/api';
import { 
  Building2, 
  Users, 
  Briefcase, 
  DollarSign, 
  TrendingUp, 
  Clock,
  UserCheck,
  UserX,
  Calendar,
  Target
} from 'lucide-react';

interface DepartmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: IDepartment | null;
}

interface DepartmentStats {
  totalEmployees: number;
  activeEmployees: number;
  onLeaveEmployees: number;
  terminatedEmployees: number;
  totalPositions: number;
  filledPositions: number;
  openPositions: number;
  avgSalary: number;
  minSalary: number;
  maxSalary: number;
  totalBudget: number;
  pendingApplications: number;
  recentHires: number;
}

export const DepartmentDetailModal: React.FC<DepartmentDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  department 
}) => {
  const [employees, setEmployees] = useState<IEmployee[]>([]);
  const [applications, setApplications] = useState<IJobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DepartmentStats | null>(null);

  useEffect(() => {
    if (isOpen && department) {
      setLoading(true);
      Promise.all([getEmployees(), getApplications()])
        .then(([empData, appData]) => {
          setEmployees(empData);
          setApplications(appData);
          
          // Calculate department statistics
          const deptEmployees = empData.filter(e => e.departmentId === department.id);
          const deptApplications = appData.filter(a => a.departmentId === department.id);
          
          const activeEmps = deptEmployees.filter(e => e.status === 'Active');
          const onLeaveEmps = deptEmployees.filter(e => e.status === 'OnLeave');
          const terminatedEmps = deptEmployees.filter(e => e.status === 'Terminated');
          
          // Calculate salary stats from jobs
          const jobSalaries = department.jobs.map(j => (j.minSalary + j.maxSalary) / 2);
          const avgSalary = jobSalaries.length > 0 
            ? jobSalaries.reduce((a, b) => a + b, 0) / jobSalaries.length 
            : 0;
          const minSalary = department.jobs.length > 0 
            ? Math.min(...department.jobs.map(j => j.minSalary)) 
            : 0;
          const maxSalary = department.jobs.length > 0 
            ? Math.max(...department.jobs.map(j => j.maxSalary)) 
            : 0;
          
          // Calculate total budget (sum of active employee salaries)
          const totalBudget = activeEmps.reduce((sum, e) => sum + (e.currentSalary || 0), 0);
          
          // Recent hires (last 30 days)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const recentHires = deptEmployees.filter(e => 
            new Date(e.hireDate) >= thirtyDaysAgo
          ).length;
          
          // Pending applications
          const pendingApps = deptApplications.filter(a => 
            a.status === 'Applied' || a.status === 'Interview'
          ).length;

          setStats({
            totalEmployees: deptEmployees.length,
            activeEmployees: activeEmps.length,
            onLeaveEmployees: onLeaveEmps.length,
            terminatedEmployees: terminatedEmps.length,
            totalPositions: department.jobs.length,
            filledPositions: activeEmps.length,
            openPositions: Math.max(0, department.jobs.length - activeEmps.length),
            avgSalary,
            minSalary,
            maxSalary,
            totalBudget,
            pendingApplications: pendingApps,
            recentHires
          });
          
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen, department]);

  if (!department) return null;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Department Details" size="lg">
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-10 h-10 border-4 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin"></div>
          <p className="text-gray-400 mt-4">Loading department data...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Department Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/30 flex items-center justify-center">
              <Building2 className="text-neon-cyan" size={24} />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-orbitron font-bold text-white">{department.name}</h2>
              <p className="text-xs text-gray-400">{department.description || 'No description provided'}</p>
            </div>
          </div>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-black/30 rounded-lg p-3 border border-neon-cyan/20">
              <div className="flex items-center gap-2 mb-1">
                <Users size={14} className="text-neon-cyan" />
                <span className="text-[10px] text-gray-400 uppercase">Staff</span>
              </div>
              <p className="text-2xl font-orbitron font-bold text-white">{stats?.totalEmployees || 0}</p>
              <p className="text-[10px] text-neon-cyan">{stats?.activeEmployees || 0} active</p>
            </div>

            <div className="bg-black/30 rounded-lg p-3 border border-neon-purple/20">
              <div className="flex items-center gap-2 mb-1">
                <Briefcase size={14} className="text-neon-purple" />
                <span className="text-[10px] text-gray-400 uppercase">Positions</span>
              </div>
              <p className="text-2xl font-orbitron font-bold text-white">{stats?.totalPositions || 0}</p>
              <p className="text-[10px] text-neon-purple">{stats?.openPositions || 0} open</p>
            </div>

            <div className="bg-black/30 rounded-lg p-3 border border-neon-green/20">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign size={14} className="text-neon-green" />
                <span className="text-[10px] text-gray-400 uppercase">Avg Salary</span>
              </div>
              <p className="text-2xl font-orbitron font-bold text-white">{formatCurrency(stats?.avgSalary || 0)}</p>
              <p className="text-[10px] text-gray-500">{formatCurrency(stats?.minSalary || 0)} - {formatCurrency(stats?.maxSalary || 0)}</p>
            </div>

            <div className="bg-black/30 rounded-lg p-3 border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={14} className="text-yellow-500" />
                <span className="text-[10px] text-gray-400 uppercase">Budget</span>
              </div>
              <p className="text-2xl font-orbitron font-bold text-white">{formatCurrency(stats?.totalBudget || 0)}</p>
              <p className="text-[10px] text-gray-500">monthly</p>
            </div>
          </div>

          {/* Secondary Stats - Compact */}
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1"><UserCheck size={14} className="text-neon-green" /> {stats?.activeEmployees || 0} Active</span>
            <span className="flex items-center gap-1"><Clock size={14} className="text-yellow-500" /> {stats?.onLeaveEmployees || 0} On Leave</span>
            <span className="flex items-center gap-1"><Target size={14} className="text-neon-purple" /> {stats?.pendingApplications || 0} Pending Apps</span>
            <span className="flex items-center gap-1"><Calendar size={14} className="text-neon-cyan" /> {stats?.recentHires || 0} Recent Hires</span>
          </div>

          {/* Job Positions List */}
          <div>
            <h3 className="text-xs font-rajdhani font-bold text-neon-cyan uppercase tracking-wider mb-2 flex items-center gap-2">
              <Briefcase size={12} /> Job Positions ({department.jobs.length})
            </h3>
            {department.jobs.length === 0 ? (
              <p className="text-gray-500 text-xs py-2">No positions defined.</p>
            ) : (
              <div className="space-y-1 max-h-[120px] overflow-y-auto custom-scrollbar pr-2">
                {department.jobs.map((job, index) => (
                  <div
                    key={job.id || index}
                    className="bg-black/20 border border-white/5 rounded px-3 py-2 flex items-center justify-between"
                  >
                    <span className="text-xs font-medium text-white">{job.title}</span>
                    <span className="text-xs text-neon-green font-mono">
                      {formatCurrency(job.minSalary)} - {formatCurrency(job.maxSalary)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Department Employees Preview */}
          <div>
            <h3 className="text-xs font-rajdhani font-bold text-neon-purple uppercase tracking-wider mb-2 flex items-center gap-2">
              <Users size={12} /> Staff ({stats?.activeEmployees || 0} active)
            </h3>
            {employees.filter(e => e.departmentId === department.id && e.status === 'Active').length === 0 ? (
              <p className="text-gray-500 text-xs py-2">No active employees.</p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-[80px] overflow-y-auto custom-scrollbar pr-2">
                {employees
                  .filter(e => e.departmentId === department.id && e.status === 'Active')
                  .slice(0, 12)
                  .map((emp) => (
                    <div
                      key={emp.id}
                      className="bg-white/5 rounded px-2 py-1 flex items-center gap-2"
                    >
                      <img 
                        src={emp.avatarUrl || `https://ui-avatars.com/api/?name=${emp.firstName}+${emp.lastName}&background=0a0a10&color=00f3ff`} 
                        alt={`${emp.firstName} ${emp.lastName}`}
                        className="w-6 h-6 rounded-full border border-neon-cyan/30"
                      />
                      <span className="text-[10px] text-white">{emp.firstName} {emp.lastName}</span>
                    </div>
                  ))}
                {employees.filter(e => e.departmentId === department.id && e.status === 'Active').length > 12 && (
                  <span className="text-[10px] text-neon-cyan py-1">
                    +{employees.filter(e => e.departmentId === department.id && e.status === 'Active').length - 12} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
