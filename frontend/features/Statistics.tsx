import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BarChart2, TrendingUp, Users, DollarSign, Building2, Wallet } from 'lucide-react';
import { NeonButton, SectionHeader, GlassCard } from '../components/ui';
import { getEmployees, getDepartments } from '../services/api';
import { IEmployee, IDepartment } from '../types';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    PieChart, Pie, Cell
} from 'recharts';

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

                        {/* Department Distribution */}
                        <GlassCard className="p-6 h-[400px] flex flex-col">
                            <h3 className="text-lg font-rajdhani font-bold text-neon-cyan mb-4 flex items-center gap-2">
                                <Users size={18} /> Department Distribution
                            </h3>
                            <div className="flex-1">
                                {deptStats.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={deptStats}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                            <XAxis dataKey="name" stroke="#888" fontSize={10} />
                                            <YAxis stroke="#888" />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0a0a10', borderColor: '#00f3ff' }}
                                                itemStyle={{ color: '#fff' }}
                                                formatter={(value: any) => [value, 'Employees']}
                                            />
                                            <Bar dataKey="count" fill="#00f3ff" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500">
                                        No employee data available
                                    </div>
                                )}
                            </div>
                        </GlassCard>

                        {/* Salary by Department */}
                        <GlassCard className="p-6 h-[400px] flex flex-col">
                            <h3 className="text-lg font-rajdhani font-bold text-neon-green mb-4 flex items-center gap-2">
                                <DollarSign size={18} /> Salary by Department
                            </h3>
                            <div className="flex-1">
                                {salaryByDeptStats.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={salaryByDeptStats} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                            <XAxis type="number" stroke="#888" tickFormatter={(v) => formatCurrency(v)} />
                                            <YAxis type="category" dataKey="name" stroke="#888" fontSize={10} width={80} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0a0a10', borderColor: '#0aff64' }}
                                                itemStyle={{ color: '#fff' }}
                                                formatter={(value: any) => [formatCurrency(value), 'Total Salary']}
                                                labelFormatter={(label: any) => salaryByDeptStats.find(d => d.name === label)?.fullName || label}
                                            />
                                            <Bar dataKey="salary" fill="#0aff64" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500">
                                        No salary data available
                                    </div>
                                )}
                            </div>
                        </GlassCard>

                        {/* Monthly Payroll Trend */}
                        <GlassCard className="p-6 h-[400px] flex flex-col">
                            <h3 className="text-lg font-rajdhani font-bold text-yellow-500 mb-4 flex items-center gap-2">
                                <Wallet size={18} /> Monthly Payroll Trend
                            </h3>
                            <div className="flex-1">
                                {monthlySalaryStats.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={monthlySalaryStats}>
                                            <defs>
                                                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ffd93d" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#ffd93d" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                            <XAxis dataKey="month" stroke="#888" />
                                            <YAxis stroke="#888" tickFormatter={(v) => formatCurrency(v)} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0a0a10', borderColor: '#ffd93d' }}
                                                itemStyle={{ color: '#fff' }}
                                                formatter={(value: any) => [formatCurrency(value), 'Payroll']}
                                            />
                                            <Area type="monotone" dataKey="amount" stroke="#ffd93d" fillOpacity={1} fill="url(#colorAmount)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500">
                                        No payroll data available
                                    </div>
                                )}
                            </div>
                        </GlassCard>

                        {/* Skill Radar */}
                        <GlassCard className="p-6 h-[400px] flex flex-col">
                            <h3 className="text-lg font-rajdhani font-bold text-neon-purple mb-4 flex items-center gap-2">
                                <TrendingUp size={18} /> Skill Matrix
                            </h3>
                            <div className="flex-1">
                                {skillStats.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillStats}>
                                            <PolarGrid stroke="#333" />
                                            <PolarAngleAxis dataKey="subject" stroke="#fff" fontSize={10} />
                                            <PolarRadiusAxis angle={30} domain={[0, 'auto']} stroke="#888" />
                                            <Radar name="Skills" dataKey="A" stroke="#bd00ff" fill="#bd00ff" fillOpacity={0.6} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0a0a10', borderColor: '#bd00ff' }}
                                                itemStyle={{ color: '#fff' }}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500">
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
