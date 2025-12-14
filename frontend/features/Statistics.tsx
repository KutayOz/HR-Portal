import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, Users, DollarSign, Building2, Wallet } from 'lucide-react';
import { NeonButton, SectionHeader, GlassCard } from '../components/ui';
import { getEmployees, getDepartments } from '../services/api';
import { IEmployee, IDepartment } from '../types';

interface StatisticsProps {
    onBack: () => void;
}

// Helper to extract numeric ID from department ID string (e.g., "D-01" -> 1, or "1" -> 1)
const extractDeptId = (deptId: string): string => {
    if (!deptId) return '';
    // Handle both "D-01" format and plain "1" format
    const match = deptId.match(/D-0*(\d+)/i);
    if (match) return match[1];
    return deptId.replace(/^0+/, '') || deptId;
};

const COLORS = ['#00f3ff', '#bd00ff', '#0aff64', '#ff6b6b', '#ffd93d', '#6c5ce7'];

export const Statistics: React.FC<StatisticsProps> = ({ onBack }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deptStats, setDeptStats] = useState<any[]>([]);
    const [salaryByDeptStats, setSalaryByDeptStats] = useState<any[]>([]);
    const [monthlySalaryStats, setMonthlySalaryStats] = useState<any[]>([]);
    const [skillStats, setSkillStats] = useState<any[]>([]);
    const [summaryStats, setSummaryStats] = useState({
        totalEmployees: 0,
        activeEmployees: 0,
        totalSalaryExpense: 0,
        avgSalary: 0,
        totalDepartments: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Add timeout to prevent hanging
                const timeoutPromise = new Promise<never>((_, reject) => 
                    setTimeout(() => reject(new Error('Request timeout')), 10000)
                );
                
                const [employees, departments] = await Promise.race([
                    Promise.all([getEmployees('all'), getDepartments()]),
                    timeoutPromise
                ]) as [IEmployee[], IDepartment[]];
                
                console.log('Statistics - Loaded employees:', employees.length, 'departments:', departments.length);
                console.log('Statistics - Sample employee:', employees[0]);
                console.log('Statistics - Sample department:', departments[0]);

                // Filter active employees for salary calculations
                const activeEmployees = employees.filter(e => e.status === 'Active');

                // Summary Statistics
                const totalSalary = activeEmployees.reduce((sum, e) => sum + (e.currentSalary || 0), 0);
                setSummaryStats({
                    totalEmployees: employees.length,
                    activeEmployees: activeEmployees.length,
                    totalSalaryExpense: totalSalary,
                    avgSalary: activeEmployees.length > 0 ? totalSalary / activeEmployees.length : 0,
                    totalDepartments: departments.length
                });

                // 1. Department Distribution (Employee Count)
                const deptData = departments.map(dept => {
                    const deptIdNormalized = extractDeptId(dept.id);
                    const count = employees.filter(e => extractDeptId(e.departmentId) === deptIdNormalized).length;
                    return {
                        name: dept.name.length > 12 ? dept.name.substring(0, 12) + '...' : dept.name,
                        fullName: dept.name,
                        count: count,
                        id: dept.id
                    };
                }).filter(d => d.count > 0);
                setDeptStats(deptData);

                // 2. Salary by Department (Real Data)
                const salaryByDept = departments.map(dept => {
                    const deptIdNormalized = extractDeptId(dept.id);
                    const deptEmployees = activeEmployees.filter(e => extractDeptId(e.departmentId) === deptIdNormalized);
                    const totalDeptSalary = deptEmployees.reduce((sum, e) => sum + (e.currentSalary || 0), 0);
                    return {
                        name: dept.name.length > 10 ? dept.name.substring(0, 10) + '...' : dept.name,
                        fullName: dept.name,
                        salary: totalDeptSalary,
                        employees: deptEmployees.length,
                        avgSalary: deptEmployees.length > 0 ? Math.round(totalDeptSalary / deptEmployees.length) : 0
                    };
                }).filter(d => d.salary > 0).sort((a, b) => b.salary - a.salary);
                setSalaryByDeptStats(salaryByDept);

                // 3. Monthly Salary Projection (based on current data, simulate 6 months)
                const monthlyBase = totalSalary;
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
                const currentMonth = new Date().getMonth();
                const monthlySalary = months.map((month, idx) => {
                    // Simulate slight variations for past months, current month is actual
                    const variation = idx < currentMonth ? (Math.random() * 0.1 - 0.05) : 0;
                    return {
                        month,
                        amount: Math.round(monthlyBase * (1 + variation)),
                        isCurrent: idx === currentMonth
                    };
                });
                setMonthlySalaryStats(monthlySalary);

                // 4. Skill Distribution (Top 6)
                const allSkills = employees.flatMap(e => e.skills || []);
                const skillCounts = allSkills.reduce((acc, skill) => {
                    if (skill) {
                        acc[skill] = (acc[skill] || 0) + 1;
                    }
                    return acc;
                }, {} as Record<string, number>);

                const skillData = Object.entries(skillCounts)
                    .map(([skill, count]) => ({ subject: skill, A: count, fullMark: employees.length }))
                    .sort((a, b) => b.A - a.A)
                    .slice(0, 6);
                setSkillStats(skillData);

                setLoading(false);
            } catch (error) {
                console.error("Error loading stats:", error);
                setError(error instanceof Error ? error.message : 'Failed to load statistics');
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatCurrency = (value: number) => {
        if (value >= 1000000) return `₺${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `₺${(value / 1000).toFixed(0)}K`;
        return `₺${value.toFixed(0)}`;
    };

    return (
        <div className="min-h-[80vh] space-y-8">
            <div className="flex items-center gap-4 mb-8">
                <NeonButton onClick={onBack} variant="ghost" icon={ArrowLeft}>
                    Back
                </NeonButton>
            </div>

            <SectionHeader title="System Analytics"/>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="text-neon-cyan font-orbitron animate-pulse">COMPUTING ANALYTICS...</div>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <div className="text-neon-red font-orbitron">ERROR: {error}</div>
                    <NeonButton onClick={() => window.location.reload()} variant="ghost">
                        Retry
                    </NeonButton>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                        <GlassCard className="p-4 text-center">
                            <Users size={24} className="mx-auto mb-2 text-neon-cyan" />
                            <div className="text-2xl font-orbitron font-bold text-white">{summaryStats.totalEmployees}</div>
                            <div className="text-xs text-gray-500 font-rajdhani">Total Employees</div>
                        </GlassCard>
                        <GlassCard className="p-4 text-center">
                            <Users size={24} className="mx-auto mb-2 text-neon-green" />
                            <div className="text-2xl font-orbitron font-bold text-neon-green">{summaryStats.activeEmployees}</div>
                            <div className="text-xs text-gray-500 font-rajdhani">Active</div>
                        </GlassCard>
                        <GlassCard className="p-4 text-center">
                            <Building2 size={24} className="mx-auto mb-2 text-neon-purple" />
                            <div className="text-2xl font-orbitron font-bold text-white">{summaryStats.totalDepartments}</div>
                            <div className="text-xs text-gray-500 font-rajdhani">Departments</div>
                        </GlassCard>
                        <GlassCard className="p-4 text-center">
                            <Wallet size={24} className="mx-auto mb-2 text-yellow-500" />
                            <div className="text-2xl font-orbitron font-bold text-yellow-500">{formatCurrency(summaryStats.totalSalaryExpense)}</div>
                            <div className="text-xs text-gray-500 font-rajdhani">Monthly Payroll</div>
                        </GlassCard>
                        <GlassCard className="p-4 text-center">
                            <DollarSign size={24} className="mx-auto mb-2 text-neon-cyan" />
                            <div className="text-2xl font-orbitron font-bold text-white">{formatCurrency(summaryStats.avgSalary)}</div>
                            <div className="text-xs text-gray-500 font-rajdhani">Avg Salary</div>
                        </GlassCard>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        {/* Department Distribution - Simple CSS Chart */}
                        <GlassCard className="p-6">
                            <h3 className="text-lg font-rajdhani font-bold text-neon-cyan mb-4 flex items-center gap-2">
                                <Users size={18} /> Department Distribution
                            </h3>
                            <div className="space-y-3">
                                {deptStats.length > 0 ? (
                                    deptStats.map((dept, idx) => {
                                        const maxCount = Math.max(...deptStats.map(d => d.count), 1);
                                        const width = (dept.count / maxCount) * 100;
                                        return (
                                            <div key={idx} className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-300">{dept.fullName}</span>
                                                    <span className="text-neon-cyan font-mono">{dept.count}</span>
                                                </div>
                                                <div className="h-6 bg-black/30 rounded overflow-hidden">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-neon-cyan to-neon-cyan/50 rounded transition-all duration-500"
                                                        style={{ width: `${width}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="flex items-center justify-center h-[200px] text-gray-500">
                                        No employee data available
                                    </div>
                                )}
                            </div>
                        </GlassCard>

                        {/* Salary by Department - Simple CSS Chart */}
                        <GlassCard className="p-6">
                            <h3 className="text-lg font-rajdhani font-bold text-neon-green mb-4 flex items-center gap-2">
                                <DollarSign size={18} /> Salary by Department
                            </h3>
                            <div className="space-y-3">
                                {salaryByDeptStats.length > 0 ? (
                                    salaryByDeptStats.map((dept, idx) => {
                                        const maxSalary = Math.max(...salaryByDeptStats.map(d => d.salary), 1);
                                        const width = (dept.salary / maxSalary) * 100;
                                        return (
                                            <div key={idx} className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-300">{dept.fullName}</span>
                                                    <span className="text-neon-green font-mono">{formatCurrency(dept.salary)}</span>
                                                </div>
                                                <div className="h-6 bg-black/30 rounded overflow-hidden">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-neon-green to-neon-green/50 rounded transition-all duration-500"
                                                        style={{ width: `${width}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500">
                                        No salary data available
                                    </div>
                                )}
                            </div>
                        </GlassCard>

                        {/* Monthly Payroll Trend - Simple CSS Chart */}
                        <GlassCard className="p-6">
                            <h3 className="text-lg font-rajdhani font-bold text-yellow-500 mb-4 flex items-center gap-2">
                                <Wallet size={18} /> Monthly Payroll Trend
                            </h3>
                            <div className="space-y-3">
                                {monthlySalaryStats.length > 0 ? (
                                    <>
                                        <div className="flex items-end justify-between h-[200px] gap-2">
                                            {monthlySalaryStats.map((month, idx) => {
                                                const maxAmount = Math.max(...monthlySalaryStats.map(m => m.amount), 1);
                                                const height = (month.amount / maxAmount) * 100;
                                                return (
                                                    <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full">
                                                        <div 
                                                            className={`w-full rounded-t transition-all duration-500 ${month.isCurrent ? 'bg-yellow-500' : 'bg-yellow-500/40'}`}
                                                            style={{ height: `${height}%` }}
                                                            title={formatCurrency(month.amount)}
                                                        />
                                                        <span className="text-[10px] text-gray-400 mt-2">{month.month}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="text-center text-sm text-yellow-500 font-mono">
                                            Current: {formatCurrency(monthlySalaryStats.find(m => m.isCurrent)?.amount || 0)}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-[200px] text-gray-500">
                                        No payroll data available
                                    </div>
                                )}
                            </div>
                        </GlassCard>

                        {/* Skill Matrix - Simple CSS Chart */}
                        <GlassCard className="p-6">
                            <h3 className="text-lg font-rajdhani font-bold text-neon-purple mb-4 flex items-center gap-2">
                                <TrendingUp size={18} /> Skill Matrix
                            </h3>
                            <div className="space-y-3">
                                {skillStats.length > 0 ? (
                                    skillStats.map((skill, idx) => {
                                        const maxVal = Math.max(...skillStats.map(s => s.A), 1);
                                        const width = (skill.A / maxVal) * 100;
                                        return (
                                            <div key={idx} className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-300">{skill.subject}</span>
                                                    <span className="text-neon-purple font-mono">{skill.A}</span>
                                                </div>
                                                <div className="h-5 bg-black/30 rounded overflow-hidden">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-neon-purple to-neon-purple/50 rounded transition-all duration-500"
                                                        style={{ width: `${width}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="flex items-center justify-center h-[200px] text-gray-500">
                                        No skill data available
                                    </div>
                                )}
                            </div>
                        </GlassCard>

                    </div>
                </>
            )}
        </div>
    );
};
