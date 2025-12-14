
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Briefcase, CalendarClock, Activity, Building2, ChevronRight, Megaphone, Plus, Trash2 } from 'lucide-react';
import { GlassCard, SectionHeader } from '../components/ui';
import { ViewState, IDepartment, ILeaveRequest, IEmployee, IAnnouncement } from '../types';
import { getDepartments, getLeaves, getEmployees, deleteAnnouncement } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
    onNavigate: (view: ViewState) => void;
    announcements?: IAnnouncement[];
    onCreateAnnouncement?: () => void;
    onAnnouncementChange?: () => void;
}


export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, announcements = [], onCreateAnnouncement, onAnnouncementChange }) => {
    const [departments, setDepartments] = useState<IDepartment[]>([]);
    const [leaves, setLeaves] = useState<ILeaveRequest[]>([]);
    const [employees, setEmployees] = useState<IEmployee[]>([]);
    const [selectedDept, setSelectedDept] = useState<IDepartment | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDeleteAnnouncement = async (id: string) => {
        if (!confirm('Are you sure you want to delete this announcement?')) return;
        setDeletingId(id);
        try {
            await deleteAnnouncement(id);
            onAnnouncementChange?.();
        } catch (error) {
            console.error('Failed to delete announcement:', error);
        } finally {
            setDeletingId(null);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'Critical': return 'text-neon-red border-neon-red/30 bg-neon-red/10';
            case 'High': return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10';
            default: return 'text-gray-300 border-white/15 bg-white/5';
        }
    };

    const loadData = () => {
        getDepartments().then(setDepartments);
        getLeaves().then(setLeaves);
        // Fetch ALL employees for accurate dashboard statistics
        getEmployees('all')
            .then(data => {
                setEmployees(data);
            })
            .catch(error => {
                console.error('Dashboard - Failed to load employees:', error);
                setEmployees([]);
            });
    };

    useEffect(() => {
        loadData();
        // Auto-refresh every 5 seconds for real-time statistics
        const interval = setInterval(loadData, 5000);
        return () => clearInterval(interval);
    }, []);

    // Helper to extract numeric ID from department ID string
    const extractDeptId = (deptId: string): string => {
        if (!deptId) return '';
        const match = deptId.match(/D-0*(\d+)/i);
        if (match) return match[1];
        return deptId.replace(/^0+/, '') || deptId;
    };

    // Calculate Stats dynamically
    const activeCount = employees.filter(e => e.status === 'Active').length;
    const onLeaveCount = employees.filter(e => e.status === 'OnLeave').length;
    const inactiveCount = employees.filter(e => e.status === 'Terminated').length;
    const activeEmployees = employees.filter(e => e.status === 'Active');
    const totalSalary = activeEmployees.reduce((sum, e) => sum + (e.currentSalary || 0), 0);

    // Salary by department for chart - ALL departments
    const salaryByDept = departments.map(dept => {
        const deptIdNormalized = extractDeptId(dept.id);
        const deptEmployees = activeEmployees.filter(e => extractDeptId(e.departmentId) === deptIdNormalized);
        const totalDeptSalary = deptEmployees.reduce((sum, e) => sum + (e.currentSalary || 0), 0);
        return {
            name: dept.name,
            shortName: dept.name.length > 6 ? dept.name.substring(0, 6) + '..' : dept.name,
            salary: totalDeptSalary,
            employees: deptEmployees.length
        };
    }).sort((a, b) => b.salary - a.salary);

    // Salary histogram data (distribution by salary ranges)
    const salaryRanges = [
        { range: '0-10K', min: 0, max: 10000 },
        { range: '10-25K', min: 10000, max: 25000 },
        { range: '25-50K', min: 25000, max: 50000 },
        { range: '50-100K', min: 50000, max: 100000 },
        { range: '100K+', min: 100000, max: Infinity }
    ];
    const salaryHistogram = salaryRanges.map(r => ({
        range: r.range,
        count: activeEmployees.filter(e => (e.currentSalary || 0) >= r.min && (e.currentSalary || 0) < r.max).length
    }));

    const formatCurrency = (value: number) => {
        if (value >= 1000000) return `₺${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `₺${(value / 1000).toFixed(0)}K`;
        return `₺${value.toFixed(0)}`;
    };

    const dataStats = [
        { name: 'Active', value: activeCount, color: '#00f3ff' },
        { name: 'Inactive', value: inactiveCount, color: '#333333' },
        { name: 'On Leave', value: onLeaveCount, color: '#bd00ff' },
    ];

    return (
        <div className="space-y-8 pb-12">
            <SectionHeader title="Dashboard"/>

            {/* Holographic Center & HUD */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12 h-auto lg:h-[400px]">

                {/* Left HUD: Departments (Interactive) */}
                <GlassCard
                    className="p-6 flex flex-col relative h-[400px] overflow-hidden cursor-pointer hover:border-neon-cyan/50 transition-all group"
                    onClick={() => onNavigate('departments')}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-rajdhani font-bold text-neon-cyan flex items-center gap-2">
                            <Building2 className="text-neon-cyan" size={18} /> Departments
                        </h3>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-gray-100 dark:bg-black/30 rounded-lg p-3 border border-gray-200 dark:border-white/5">
                            <div className="text-[10px] text-gray-500 font-rajdhani uppercase mb-1">Total Departments</div>
                            <div className="text-2xl font-orbitron font-bold text-gray-900 dark:text-white">{departments.length}</div>
                        </div>
                        <div className="bg-gray-100 dark:bg-black/30 rounded-lg p-3 border border-gray-200 dark:border-white/5">
                            <div className="text-[10px] text-gray-500 font-rajdhani uppercase mb-1">Total Positions</div>
                            <div className="text-2xl font-orbitron font-bold text-neon-cyan">
                                {departments.reduce((sum, d) => sum + d.jobs.length, 0)}
                            </div>
                        </div>
                    </div>

                    {/* Department List */}
                    <div className="flex-1 min-h-0 space-y-2 overflow-y-auto custom-scrollbar pr-2" style={{ maxHeight: 'calc(100% - 120px)' }}>
                        {departments.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 text-sm">
                                <Building2 className="mx-auto mb-3 opacity-30" size={48} />
                                <p className="font-rajdhani">No departments yet</p>
                                <p className="text-xs mt-2 text-gray-600">Click this card to get started</p>
                            </div>
                        ) : (
                            departments.map((dept) => (
                                <div
                                    key={dept.id}
                                    className="p-3 rounded border bg-white/5 border-transparent hover:bg-white/10 hover:border-neon-cyan/30 transition-all duration-300"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-orbitron text-sm text-gray-900 dark:text-white">{dept.name}</span>
                                        <span className="text-xs text-gray-500 font-mono">{dept.jobs.length} positions</span>
                                    </div>
                                    {dept.description && (
                                        <p className="text-xs text-gray-400 line-clamp-1 italic">{dept.description}</p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </GlassCard>



                {/* Right HUD: Analytics Preview (Interactive) */}
                <GlassCard
                    className="p-6 flex flex-col relative h-[400px] cursor-pointer hover:border-neon-purple/50 transition-all group"
                    onClick={() => onNavigate('statistics')}
                >
                    <h3 className="text-lg font-rajdhani font-bold text-neon-purple mb-4 flex items-center gap-2">
                        <Activity size={18} /> System Analytics
                    </h3>

                    {/* Summary Stats Row */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-gray-100 dark:bg-black/30 rounded p-2 text-center border border-gray-200 dark:border-white/5">
                            <div className="text-lg font-orbitron font-bold text-neon-cyan">{activeCount}</div>
                            <div className="text-[10px] text-gray-500">Active</div>
                        </div>
                        <div className="bg-gray-100 dark:bg-black/30 rounded p-2 text-center border border-gray-200 dark:border-white/5">
                            <div className="text-lg font-orbitron font-bold text-yellow-500">{formatCurrency(totalSalary)}</div>
                            <div className="text-[10px] text-gray-500">Payroll</div>
                        </div>
                        <div className="bg-gray-100 dark:bg-black/30 rounded p-2 text-center border border-gray-200 dark:border-white/5">
                            <div className="text-lg font-orbitron font-bold text-neon-green">{departments.length}</div>
                            <div className="text-[10px] text-gray-500">Depts</div>
                        </div>
                    </div>

                    {/* Salary Histogram - Mini */}
                    <div className="mb-3">
                        <div className="text-[10px] text-gray-500 mb-1 font-rajdhani">Salary Distribution</div>
                        <div className="flex items-end gap-1 h-12">
                            {salaryHistogram.map((item, idx) => {
                                const maxCount = Math.max(...salaryHistogram.map(h => h.count), 1);
                                const height = item.count > 0 ? Math.max((item.count / maxCount) * 100, 10) : 5;
                                return (
                                    <div key={idx} className="flex-1 flex flex-col items-center">
                                        <div 
                                            className="w-full bg-neon-purple/60 rounded-t transition-all hover:bg-neon-purple"
                                            style={{ height: `${height}%` }}
                                            title={`${item.range}: ${item.count} employees`}
                                        />
                                        <span className="text-[8px] text-gray-600 mt-1">{item.range}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Vertical Bar Chart - Horizontally Scrollable - All Departments */}
                    <div className="overflow-x-auto custom-scrollbar" style={{ height: 150 }}>
                        {departments.length > 0 ? (
                            <div style={{ width: Math.max(departments.length * 60, 300), height: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={salaryByDept} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                        <XAxis 
                                            dataKey="shortName" 
                                            stroke="#666" 
                                            fontSize={0}
                                            tick={false}
                                            axisLine={{ stroke: '#333' }}
                                        />
                                        <YAxis 
                                            stroke="#666" 
                                            fontSize={8} 
                                            tickFormatter={(v) => formatCurrency(v)}
                                            width={40}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                                            contentStyle={{ backgroundColor: '#0a0a10', borderColor: '#0aff64', borderRadius: 8 }}
                                            itemStyle={{ color: '#fff' }}
                                            labelStyle={{ color: '#0aff64', fontWeight: 'bold' }}
                                            formatter={(value: any, name: string, props: any) => [
                                                `${formatCurrency(value)} (${props.payload.employees} employees)`,
                                                'Total Salary'
                                            ]}
                                            labelFormatter={(label: any, payload: any) => payload?.[0]?.payload?.name || label}
                                        />
                                        <Bar 
                                            dataKey="salary" 
                                            fill="#0aff64" 
                                            radius={[4, 4, 0, 0]} 
                                            barSize={30}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dataStats}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ backgroundColor: '#0a0a10', borderColor: '#bd00ff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Bar dataKey="value" fill="#bd00ff" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </GlassCard>
            </div>

            {/* Navigation Cards (Modules) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <GlassCard
                    hoverEffect
                    onClick={() => onNavigate('employees')}
                    className="h-32 flex flex-row items-center justify-center group p-6 gap-6"
                >
                    <div className="w-16 h-16 rounded-2xl bg-neon-cyan/5 border border-neon-cyan/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(0,243,255,0.1)] group-hover:shadow-[0_0_25px_rgba(0,243,255,0.3)]">
                        <Users size={32} className="text-neon-cyan" />
                    </div>
                    <h3 className="text-xl font-orbitron font-bold text-gray-900 dark:text-white">Personnel</h3>
                </GlassCard>

                <GlassCard
                    hoverEffect
                    onClick={() => onNavigate('recruitment')}
                    className="h-32 flex flex-row items-center justify-center group p-6 gap-6"
                >
                    <div className="w-16 h-16 rounded-2xl bg-neon-purple/5 border border-neon-purple/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(189,0,255,0.1)] group-hover:shadow-[0_0_25px_rgba(189,0,255,0.3)]">
                        <Briefcase size={32} className="text-neon-purple" />
                    </div>
                    <h3 className="text-xl font-orbitron font-bold text-gray-900 dark:text-white">Recruitment</h3>
                </GlassCard>

                <GlassCard
                    hoverEffect
                    onClick={() => onNavigate('leaves')}
                    className="h-32 flex flex-row items-center justify-center group p-6 gap-6"
                >
                    <div className="w-16 h-16 rounded-2xl bg-neon-green/5 border border-neon-green/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(10,255,100,0.1)] group-hover:shadow-[0_0_25px_rgba(10,255,100,0.3)]">
                        <CalendarClock size={32} className="text-neon-green" />
                    </div>
                    <h3 className="text-xl font-orbitron font-bold text-gray-900 dark:text-white">Requests</h3>
                </GlassCard>

            </div>

            {/* Announcements Panel */}
            <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-rajdhani font-bold text-neon-cyan flex items-center gap-2">
                        <Megaphone className="text-neon-cyan" size={18} /> Announcements
                    </h3>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onCreateAnnouncement?.();
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan/30 rounded-lg text-neon-cyan text-sm font-rajdhani font-bold transition-all hover:shadow-[0_0_15px_rgba(0,243,255,0.3)]"
                    >
                        <Plus size={16} /> New Announcement
                    </button>
                </div>

                {announcements.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <Megaphone className="mx-auto mb-3 opacity-30" size={48} />
                        <p className="font-rajdhani">No announcements yet</p>
                        <p className="text-xs mt-2 text-gray-600">Create your first announcement to broadcast to the team</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                        {announcements.map((announcement) => (
                            <motion.div
                                key={announcement.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 rounded-lg bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 transition-all group"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="font-orbitron text-sm text-gray-900 dark:text-white truncate">{announcement.title}</h4>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-orbitron uppercase tracking-wider border ${getPriorityColor(announcement.priority)}`}>
                                                {announcement.priority}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400 line-clamp-2">{announcement.content}</p>
                                        {announcement.expiryDate && (
                                            <p className="text-[10px] text-gray-500 mt-2 font-mono">
                                                Expires: {new Date(announcement.expiryDate).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteAnnouncement(announcement.id);
                                        }}
                                        disabled={deletingId === announcement.id}
                                        className="p-2 text-gray-500 hover:text-neon-red hover:bg-neon-red/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                        title="Delete Announcement"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </GlassCard>
        </div>
    );
};
