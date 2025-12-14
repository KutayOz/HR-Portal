import React, { useState, useEffect } from 'react';
import { FileText, Edit3, Save, Plus } from 'lucide-react';
import { getContractsByEmployee, updateContract, createContract } from '../services/api';
import { NeonButton } from '../components/ui';

interface EmployeeContractsProps {
    employeeId: number;
    readOnly?: boolean;
    readOnlyReason?: 'switch' | 'request';
    onRequestAccess?: () => Promise<void>;
}

export const EmployeeContracts: React.FC<EmployeeContractsProps> = ({ employeeId, readOnly = false, readOnlyReason, onRequestAccess }) => {
    const [contract, setContract] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [creating, setCreating] = useState(false);
    const [formData, setFormData] = useState({
        contractType: 'FullTime',
        startDate: '',
        salary: 0,
        workingHoursPerWeek: 40,
        terms: '',
        currency: 'TRY',
        paymentFrequency: 'Monthly',
        isActive: true
    });

    const loadContract = () => {
        setLoading(true);
        getContractsByEmployee(employeeId)
            .then(data => {
                console.log('Contracts loaded for employee', employeeId, ':', data);
                // Employee has single contract - get the first (and only) one
                if (data && data.length > 0) {
                    const c = data[0];
                    setContract(c);
                    setFormData({
                        contractType: c.contractType || 'FullTime',
                        startDate: c.startDate ? c.startDate.split('T')[0] : '',
                        salary: c.salary || 0,
                        workingHoursPerWeek: c.workingHoursPerWeek || 40,
                        terms: c.terms || '',
                        currency: c.currency || 'TRY',
                        paymentFrequency: c.paymentFrequency || 'Monthly',
                        isActive: c.isActive ?? true
                    });
                } else {
                    setContract(null);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to load contracts:', err);
                setContract(null);
                setLoading(false);
            });
    };

    useEffect(() => {
        loadContract();
    }, [employeeId]);

    useEffect(() => {
        if (readOnly) {
            setEditing(false);
        }
    }, [readOnly]);

    const handleSave = async () => {
        if (!contract) return;
        setSaving(true);
        try {
            await updateContract(contract.id, {
                ...formData,
                salary: parseFloat(formData.salary.toString()),
                workingHoursPerWeek: parseInt(formData.workingHoursPerWeek.toString())
            });
            setEditing(false);
            loadContract();
        } catch (error) {
            console.error('Failed to update contract', error);
        } finally {
            setSaving(false);
        }
    };

    const handleCreate = async () => {
        setCreating(true);
        try {
            await createContract({
                employeeId,
                contractType: 'FullTime',
                startDate: new Date().toISOString().split('T')[0],
                salary: 0,
                workingHoursPerWeek: 40,
                terms: 'Standard employment contract',
                currency: 'TRY',
                paymentFrequency: 'Monthly'
            });
            loadContract();
        } catch (error) {
            console.error('Failed to create contract', error);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="space-y-4">
            {readOnly && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-xs text-gray-400 flex items-center justify-between">
                    <span>
                        {readOnlyReason === 'switch'
                            ? 'Switch to "Yours" to modify.'
                            : 'Read-only. Request access to modify.'}
                    </span>
                    {readOnlyReason === 'request' && onRequestAccess && (
                        <NeonButton onClick={onRequestAccess} variant="ghost" className="px-3 py-1 text-xs">
                            Request Access
                        </NeonButton>
                    )}
                </div>
            )}

            <div className="flex justify-between items-center">
                <h3 className="text-lg font-orbitron text-neon-cyan flex items-center gap-2">
                    <FileText size={20} />
                    Employment Contract
                </h3>
                {!readOnly && !contract && !loading && (
                    <NeonButton onClick={handleCreate} icon={Plus} disabled={creating}>
                        {creating ? 'Creating...' : 'Create Contract'}
                    </NeonButton>
                )}
                {!readOnly && contract && !editing && (
                    <NeonButton onClick={() => setEditing(true)} icon={Edit3}>
                        Edit Contract
                    </NeonButton>
                )}
                {!readOnly && editing && (
                    <NeonButton onClick={handleSave} icon={Save} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </NeonButton>
                )}
            </div>

            {loading ? (
                <div className="text-center text-gray-500 py-4">Loading contract...</div>
            ) : !contract ? (
                <div className="text-center py-8 bg-white/5 rounded-lg border border-white/10">
                    <FileText size={32} className="mx-auto mb-3 text-gray-600" />
                    <div className="text-gray-500">No contract found for this employee</div>
                </div>
            ) : (
                <div className="bg-white/5 p-4 rounded-lg border border-white/10 space-y-4">
                    {/* Contract Status Badge */}
                    <div className="flex items-center gap-2">
                        {formData.isActive ? (
                            <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded">Active Contract</span>
                        ) : (
                            <span className="text-xs bg-red-500/20 text-red-500 px-2 py-0.5 rounded">Inactive</span>
                        )}
                    </div>

                    {/* Contract Fields - Always Visible */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Contract Type</label>
                            {editing ? (
                                <select
                                    className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white text-sm"
                                    value={formData.contractType}
                                    onChange={e => setFormData({ ...formData, contractType: e.target.value })}
                                >
                                    <option value="FullTime">Full Time</option>
                                    <option value="PartTime">Part Time</option>
                                    <option value="Contract">Contract</option>
                                    <option value="Temporary">Temporary</option>
                                    <option value="Internship">Internship</option>
                                </select>
                            ) : (
                                <div className="text-white font-medium">{formData.contractType}</div>
                            )}
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Start Date</label>
                            {editing ? (
                                <input
                                    type="date"
                                    className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white text-sm"
                                    value={formData.startDate}
                                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                />
                            ) : (
                                <div className="text-white font-medium">
                                    {formData.startDate ? new Date(formData.startDate).toLocaleDateString('tr-TR') : '-'}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Salary</label>
                            {editing ? (
                                <input
                                    type="number"
                                    className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white text-sm"
                                    value={formData.salary}
                                    onChange={e => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })}
                                />
                            ) : (
                                <div className="text-neon-green font-bold text-lg">
                                    {formData.salary.toLocaleString('tr-TR')} {formData.currency}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Payment Frequency</label>
                            {editing ? (
                                <select
                                    className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white text-sm"
                                    value={formData.paymentFrequency}
                                    onChange={e => setFormData({ ...formData, paymentFrequency: e.target.value })}
                                >
                                    <option value="Monthly">Monthly</option>
                                    <option value="Biweekly">Biweekly</option>
                                    <option value="Weekly">Weekly</option>
                                </select>
                            ) : (
                                <div className="text-white font-medium">{formData.paymentFrequency}</div>
                            )}
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Working Hours/Week</label>
                            {editing ? (
                                <input
                                    type="number"
                                    className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white text-sm"
                                    value={formData.workingHoursPerWeek}
                                    onChange={e => setFormData({ ...formData, workingHoursPerWeek: parseInt(e.target.value) || 0 })}
                                />
                            ) : (
                                <div className="text-white font-medium">{formData.workingHoursPerWeek} hours</div>
                            )}
                        </div>

                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Currency</label>
                            {editing ? (
                                <select
                                    className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white text-sm"
                                    value={formData.currency}
                                    onChange={e => setFormData({ ...formData, currency: e.target.value })}
                                >
                                    <option value="TRY">TRY</option>
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                </select>
                            ) : (
                                <div className="text-white font-medium">{formData.currency}</div>
                            )}
                        </div>
                    </div>

                    {/* Terms */}
                    <div>
                        <label className="text-xs text-gray-500 block mb-1">Terms & Conditions</label>
                        {editing ? (
                            <textarea
                                className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white text-sm"
                                rows={3}
                                value={formData.terms}
                                onChange={e => setFormData({ ...formData, terms: e.target.value })}
                            />
                        ) : (
                            <div className="text-gray-400 text-sm">{formData.terms || 'No terms specified'}</div>
                        )}
                    </div>

                    {/* Cancel button when editing */}
                    {editing && (
                        <div className="flex justify-end">
                            <button
                                onClick={() => {
                                    setEditing(false);
                                    loadContract(); // Reset form data
                                }}
                                className="text-gray-400 hover:text-white text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
