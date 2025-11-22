import React, { useState, useEffect } from 'react';
import { Modal } from '../components/Modal';
import { createJob, updateJob, getDepartments } from '../services/api';
import { IDepartment } from '../types';

interface JobFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editJob?: any; // Using any for now as Job type needs to be fully defined in types.ts
}

export const JobForm: React.FC<JobFormProps> = ({ isOpen, onClose, onSuccess, editJob }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [departments, setDepartments] = useState<IDepartment[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        minSalary: '',
        maxSalary: '',
        departmentId: '',
        isActive: true
    });

    useEffect(() => {
        if (isOpen) {
            getDepartments().then(setDepartments).catch(console.error);
        }
    }, [isOpen]);

    useEffect(() => {
        if (editJob) {
            setFormData({
                title: editJob.title,
                description: editJob.description || '',
                minSalary: editJob.minSalary.toString(),
                maxSalary: editJob.maxSalary.toString(),
                departmentId: editJob.departmentId.toString(),
                isActive: editJob.isActive ?? true
            });
        } else {
            setFormData({
                title: '',
                description: '',
                minSalary: '',
                maxSalary: '',
                departmentId: '',
                isActive: true
            });
        }
    }, [editJob, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const payload = {
                title: formData.title,
                description: formData.description,
                minSalary: parseFloat(formData.minSalary),
                maxSalary: parseFloat(formData.maxSalary),
                departmentId: parseInt(formData.departmentId),
                isActive: formData.isActive
            };

            if (editJob) {
                await updateJob(editJob.id, payload);
            } else {
                await createJob(payload);
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to save job');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editJob ? 'Edit Job' : 'Add Job'} size="md">
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="bg-neon-red/10 border border-neon-red/30 text-neon-red px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Job Title *</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-neon-cyan focus:outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        rows={3}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-neon-cyan focus:outline-none resize-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Min Salary *</label>
                        <input
                            type="number"
                            name="minSalary"
                            value={formData.minSalary}
                            onChange={handleChange}
                            required
                            min="0"
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-neon-cyan focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Max Salary *</label>
                        <input
                            type="number"
                            name="maxSalary"
                            value={formData.maxSalary}
                            onChange={handleChange}
                            required
                            min="0"
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-neon-cyan focus:outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Department *</label>
                    <select
                        name="departmentId"
                        value={formData.departmentId}
                        onChange={handleChange}
                        required
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-neon-cyan focus:outline-none"
                    >
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                            <option key={dept.id} value={parseInt(dept.id)}>{dept.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-gradient-to-r from-neon-cyan to-neon-purple hover:shadow-[0_0_20px_rgba(0,243,255,0.5)] rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-orbitron"
                    >
                        {loading ? 'Saving...' : (editJob ? 'Update Job' : 'Create Job')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
