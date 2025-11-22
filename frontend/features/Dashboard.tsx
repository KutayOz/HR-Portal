
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Briefcase, CalendarClock, Activity, Building2, ChevronRight } from 'lucide-react';
import { GlassCard, SectionHeader } from '../components/ui';
import { ViewState, IDepartment, ILeaveRequest, IEmployee } from '../types';
import { getDepartments, getLeaves, getEmployees } from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DashboardProps {
  onNavigate: (view: ViewState) => void;
}

// Custom Tooltip for the Pie Chart
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0a0a10]/95 border border-neon-cyan/30 p-3 rounded-lg shadow-[0_0_20px_rgba(0,243,255,0.2)] backdrop-blur-xl">
        <p className="text-[10px] font-rajdhani text-gray-400 uppercase tracking-widest mb-1">{payload[0].name}</p>
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.color }} />
            <p className="text-lg font-orbitron font-bold text-white">{payload[0].value}</p>
        </div>
      </div>
    );
  }
  return null;
};

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [leaves, setLeaves] = useState<ILeaveRequest[]>([]);
  const [employees, setEmployees] = useState<IEmployee[]>([]);
  const [selectedDept, setSelectedDept] = useState<IDepartment | null>(null);

  useEffect(() => {
    getDepartments().then(setDepartments);
    getLeaves().then(setLeaves);
    getEmployees().then(setEmployees);
  }, []);

  // Calculate Stats dynamically
  const activeCount = employees.filter(e => e.status === 'Active').length;
  const onLeaveCount = employees.filter(e => e.status === 'OnLeave').length;
  const inactiveCount = employees.filter(e => e.status === 'Terminated').length;

  const dataStats = [
    { name: 'Active Agents', value: activeCount, color: '#00f3ff' }, // Neon Cyan
    { name: 'Inactive', value: inactiveCount, color: '#333333' },   // Dark Gray
    { name: 'On Leave', value: onLeaveCount, color: '#bd00ff' },     // Neon Purple
  ];

  return (
    <div className="space-y-8 pb-12">
      <SectionHeader title="Command Center" subtitle="System Status: Optimal" />

      {/* Holographic Center & HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12 h-auto lg:h-[400px]">
        
        {/* Left HUD: Departments (Interactive) */}
        <GlassCard 
            className="p-6 flex flex-col relative h-[400px] cursor-pointer hover:border-neon-cyan/50 transition-all group"
            onClick={() => onNavigate('departments')}
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-rajdhani font-bold text-neon-cyan flex items-center gap-2">
                    <Building2 className="text-neon-cyan" size={18} /> Departments
                </h3>
                <div className="text-xs text-gray-500 group-hover:text-neon-cyan transition-colors font-rajdhani">
                    Click to manage →
                </div>
            </div>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                    <div className="text-xs text-gray-500 font-rajdhani uppercase mb-1">Total Departments</div>
                    <div className="text-3xl font-orbitron font-bold text-white">{departments.length}</div>
                </div>
                <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                    <div className="text-xs text-gray-500 font-rajdhani uppercase mb-1">Total Positions</div>
                    <div className="text-3xl font-orbitron font-bold text-neon-cyan">
                        {departments.reduce((sum, d) => sum + d.jobs.length, 0)}
                    </div>
                </div>
            </div>

            {/* Department List */}
            <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2">
                {departments.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 text-sm">
                        <Building2 className="mx-auto mb-3 opacity-30" size={48} />
                        <p className="font-rajdhani">No departments yet</p>
                        <p className="text-xs mt-2 text-gray-600">Click this card to get started</p>
                    </div>
                ) : (
                    departments.slice(0, 5).map((dept) => (
                        <div 
                            key={dept.id}
                            className="p-3 rounded border bg-white/5 border-transparent hover:bg-white/10 hover:border-neon-cyan/30 transition-all duration-300"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-orbitron text-sm text-white">{dept.name}</span>
                                <span className="text-xs text-gray-500 font-mono">{dept.jobs.length} positions</span>
                            </div>
                            {dept.description && (
                                <p className="text-xs text-gray-400 line-clamp-1 italic">{dept.description}</p>
                            )}
                        </div>
                    ))
                )}
                {departments.length > 5 && (
                    <div className="text-center py-2 text-xs text-neon-cyan font-rajdhani">
                        +{departments.length - 5} more departments
                    </div>
                )}
            </div>
            
            {/* Click to View All */}
            {departments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10 text-center">
                    <div className="text-sm text-neon-cyan group-hover:text-neon-purple transition-colors font-rajdhani font-bold">
                        Click to view all departments →
                    </div>
                </div>
            )}
        </GlassCard>

        {/* Center Hologram: Organizational Structure */}
        <div className="relative flex items-center justify-center lg:col-span-1 min-h-[300px]">
            {/* Rotating Rings */}
            <div className="absolute w-64 h-64 rounded-full border border-neon-cyan/20 animate-spin-slow" />
            <div className="absolute w-48 h-48 rounded-full border border-neon-purple/30 animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '15s' }} />
            <div className="absolute w-32 h-32 rounded-full border border-white/10 animate-pulse" />
            
            {/* Center Content */}
            <div className="relative z-10 text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-black/50 backdrop-blur-md border border-neon-cyan flex items-center justify-center shadow-[0_0_30px_rgba(0,243,255,0.2)]">
                    <Activity size={40} className="text-neon-cyan" />
                </div>
                <h2 className="text-2xl font-orbitron font-bold tracking-widest text-white">NEXUS</h2>
                <p className="text-xs text-neon-purple tracking-[0.3em] mt-1">ORG STRUCTURE</p>
            </div>

            {/* Decorative Lines */}
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-neon-cyan/20 to-transparent" />
            <div className="absolute left-1/2 top-0 w-[1px] h-full bg-gradient-to-b from-transparent via-neon-purple/20 to-transparent" />
        </div>

        {/* Right HUD: Active Agents (Pie Chart) */}
        <GlassCard className="p-6 flex flex-col relative h-[400px]">
           <h3 className="text-lg font-rajdhani font-bold text-neon-purple mb-4 flex items-center gap-2">
              <Activity size={18} /> Active Agents
           </h3>
           
           <div className="flex-1 relative">
               <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie 
                            data={dataStats} 
                            innerRadius={70} 
                            outerRadius={90} 
                            paddingAngle={4}
                            dataKey="value"
                            stroke="none"
                        >
                            {dataStats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.5)" strokeWidth={2} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
               </ResponsiveContainer>

               {/* Center Count Label */}
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-4xl font-orbitron font-bold text-white">{employees.length}</span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Total</span>
               </div>
           </div>
           
           {/* Server Load */}
           <div className="mt-auto pt-4 border-t border-white/10">
               <div className="flex justify-between text-[10px] font-mono text-neon-green mb-1">
                   <span>SERVER LOAD</span>
                   <span>12%</span>
               </div>
               <div className="h-1 bg-gray-800 w-full rounded-full overflow-hidden">
                   <div className="h-full bg-neon-green w-[12%] shadow-[0_0_10px_#0aff64]" />
               </div>
           </div>
        </GlassCard>
      </div>

      {/* Navigation Cards (Modules) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <GlassCard 
          hoverEffect 
          onClick={() => onNavigate('employees')}
          className="h-48 flex flex-col items-center justify-center text-center group p-4"
        >
           <div className="w-16 h-16 rounded-2xl bg-neon-cyan/5 border border-neon-cyan/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(0,243,255,0.1)] group-hover:shadow-[0_0_25px_rgba(0,243,255,0.3)]">
              <Users size={32} className="text-neon-cyan" />
           </div>
           <h3 className="text-xl font-orbitron font-bold text-white mb-1">Personnel</h3>
           <p className="text-sm text-gray-400 font-rajdhani">Manage Identity Chips & Skills</p>
        </GlassCard>

        <GlassCard 
          hoverEffect 
          onClick={() => onNavigate('recruitment')}
          className="h-48 flex flex-col items-center justify-center text-center group p-4"
        >
           <div className="w-16 h-16 rounded-2xl bg-neon-purple/5 border border-neon-purple/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(189,0,255,0.1)] group-hover:shadow-[0_0_25px_rgba(189,0,255,0.3)]">
              <Briefcase size={32} className="text-neon-purple" />
           </div>
           <h3 className="text-xl font-orbitron font-bold text-white mb-1">Recruitment</h3>
           <p className="text-sm text-gray-400 font-rajdhani">Pipeline & Candidate Stats</p>
        </GlassCard>

        <GlassCard 
          hoverEffect 
          onClick={() => onNavigate('leaves')}
          className="h-48 flex flex-col items-center justify-center text-center group p-4"
        >
           <div className="w-16 h-16 rounded-2xl bg-neon-green/5 border border-neon-green/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(10,255,100,0.1)] group-hover:shadow-[0_0_25px_rgba(10,255,100,0.3)]">
              <CalendarClock size={32} className="text-neon-green" />
           </div>
           <h3 className="text-xl font-orbitron font-bold text-white mb-1">Time Flux</h3>
           <p className="text-sm text-gray-400 font-rajdhani">Leave Management Timeline</p>
        </GlassCard>

      </div>
    </div>
  );
};
