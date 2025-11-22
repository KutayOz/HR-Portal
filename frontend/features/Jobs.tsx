import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Briefcase, Plus, Edit2, Trash2, DollarSign, Building2 } from 'lucide-react';
import { GlassCard, NeonButton, SectionHeader } from '../components/ui';
import { IJob } from '../types';
import { getJobs, deleteJob } from '../services/api';
import { JobForm } from './JobForm';

interface JobsProps {
    onBack: () => void;
}

export const Jobs: React.FC<JobsProps> = ({ onBack }) => {
    const [jobs, setJobs] = useState<IJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingJob, setEditingJob] = useState<IJob | null>(null);

    const loadJobs = () => {
        setLoading(true);
        getJobs().then((data) => {
            setJobs(data);
            setLoading(false);
        });
    };

    useEffect(() => {
        loadJobs();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this job?')) {
            return;
        }

        try {
            await deleteJob(id);
            loadJobs();
        } catch (error: any) {
            alert(error.message || 'Failed to delete job');
        }
    };

    const handleEdit = (job: IJob) => {
        setEditingJob(job);
        setShowAddForm(true);
    };

    return (
        <div className="relative min-h-[80vh]">
            <JobForm
                isOpen={showAddForm}
                onClose={() => {
                    setShowAddForm(false);
                    setEditingJob(null);
                }}
                onSuccess={loadJobs}
                editJob={editingJob}
            />

            <div className="flex items-center justify-between mb-8">
                <NeonButton onClick={onBack} variant="ghost" icon={ArrowLeft}>
                    Back
                </NeonButton>
                <NeonButton onClick={() => setShowAddForm(true)} icon={Plus}>
                    Add Job
                </NeonButton>
            </div>

            <SectionHeader title="Job Positions" subtitle="Manage open roles and requirements" />

            {loading ? (
                <div className="text-center py-20">
                    <div className="inline-block w-12 h-12 border-4 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin"></div>
                    <p className="text-gray-400 mt-4">Loading jobs...</p>
                </div>
            ) : jobs.length === 0 ? (
                <GlassCard className="p-16 text-center">
                    <Briefcase className="w-20 h-20 mx-auto mb-4 text-gray-600" />
                    <h3 className="text-xl font-orbitron font-bold mb-2">No Jobs Yet</h3>
                    <p className="text-gray-400 mb-2">You haven't created any job positions.</p>
                    <p className="text-gray-500 text-sm">Use the <span className="text-neon-cyan font-rajdhani">"Add Job"</span> button above to create your first one.</p>
                </GlassCard>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jobs.map((job) => (
                        <motion.div
                            key={job.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="group"
                        >
                            <GlassCard className="p-6 hover:border-neon-cyan/50 transition-all duration-300 cursor-pointer h-full flex flex-col">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-neon-purple/20 to-neon-cyan/20 border border-neon-purple/30 flex items-center justify-center">
                                                <Briefcase className="text-neon-purple" size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-orbitron font-bold text-white">{job.title}</h3>
                                                <div className="flex items-center gap-1 text-xs text-gray-500 font-rajdhani">
                                                    <Building2 size={10} />
                                                    <span>{job.departmentName || 'Unknown Dept'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEdit(job)}
                                            className="p-2 bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan/30 rounded-lg transition-colors"
                                            title="Edit Job"
                                        >
                                            <Edit2 size={16} className="text-neon-cyan" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(job.id)}
                                            className="p-2 bg-neon-red/10 hover:bg-neon-red/20 border border-neon-red/30 rounded-lg transition-colors"
                                            title="Delete Job"
                                        >
                                            <Trash2 size={16} className="text-neon-red" />
                                        </button>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="mb-4 flex-1">
                                    <p className="text-sm text-gray-400 italic line-clamp-3">
                                        {job.description || 'No description provided'}
                                    </p>
                                </div>

                                {/* Salary */}
                                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-neon-green">
                                        <DollarSign size={16} />
                                        <span className="font-mono font-bold">
                                            {(job.minSalary / 1000).toFixed(0)}k - {(job.maxSalary / 1000).toFixed(0)}k
                                        </span>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded border ${job.isActive ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
                                        {job.isActive ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
                                </div>
                            </GlassCard>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};
