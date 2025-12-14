import React, { useState, useEffect } from 'react';
import { TrendingUp, Plus, DollarSign } from 'lucide-react';
import { getCompensationChangesByEmployee, createCompensationChange } from '../services/api';
import { NeonButton } from '../components/ui';

interface EmployeeCompensationProps {
    employeeId: number;
    currentSalary: number;
    readOnly?: boolean;
    readOnlyReason?: 'switch' | 'request';
    onRequestAccess?: () => Promise<void>;
}

export const EmployeeCompensation: React.FC<EmployeeCompensationProps> = ({ employeeId, currentSalary, readOnly = false, readOnlyReason, onRequestAccess }) => {
    const [changes, setChanges] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        newSalary: '',
        changeReason: 'Annual Increase',
        effectiveDate: '',
        comments: ''
    });

    const loadChanges = () => {
        setLoading(true);
        getCompensationChangesByEmployee(employeeId).then(data => {
            setChanges(data);
            setLoading(false);
        });
    };

    useEffect(() => {
        loadChanges();
    }, [employeeId]);

    useEffect(() => {
        if (readOnly) {
            setShowForm(false);
        }
    }, [readOnly]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const latestSalary = changes.length > 0 ? changes[0].newSalary : currentSalary;

            await createCompensationChange({
                employeeId,
                oldSalary: latestSalary,
                newSalary: parseFloat(formData.newSalary),
                changeReason: formData.changeReason,
                effectiveDate: formData.effectiveDate,
                comments: formData.comments
            });
            setShowForm(false);
            loadChanges();
        } catch (error) {
            console.error('Failed to record compensation change', error);
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
                <h3 className="text-lg font-orbitron text-neon-cyan">Compensation History</h3>
                {!readOnly && (
                    <NeonButton onClick={() => setShowForm(!showForm)} icon={Plus}>
                        Record Change
                    </NeonButton>
                )}
            </div>

            {!readOnly && showForm && (
                <form onSubmit={handleSubmit} className="bg-white/5 p-4 rounded-lg border border-white/10 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            type="number"
                            placeholder="New Salary"
                            className="bg-black/50 border border-white/10 rounded px-3 py-2 text-white"
                            value={formData.newSalary}
                            onChange={e => setFormData({ ...formData, newSalary: e.target.value })}
                            required
                        />
                        <input
                            type="date"
                            className="bg-black/50 border border-white/10 rounded px-3 py-2 text-white"
                            value={formData.effectiveDate}
                            onChange={e => setFormData({ ...formData, effectiveDate: e.target.value })}
                            required
                        />
                    </div>
                    <select
                        className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white"
                        value={formData.changeReason}
                        onChange={e => setFormData({ ...formData, changeReason: e.target.value })}
                    >
                        <option value="Annual Increase">Annual Increase</option>
                        <option value="Promotion">Promotion</option>
                        <option value="Market Adjustment">Market Adjustment</option>
                        <option value="Performance Bonus">Performance Bonus</option>
                    </select>
                    <textarea
                        placeholder="Comments"
                        className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white"
                        value={formData.comments}
                        onChange={e => setFormData({ ...formData, comments: e.target.value })}
                    />
                    <div className="flex justify-end">
                        <button type="submit" className="bg-neon-green/20 text-neon-green px-4 py-2 rounded hover:bg-neon-green/30 transition-colors">
                            Save Change
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-3">
                {loading ? (
                    <div className="text-center text-gray-500">Loading history...</div>
                ) : changes.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">No compensation history found</div>
                ) : (
                    changes.map(change => (
                        <div key={change.id} className="bg-white/5 p-4 rounded-lg border border-white/10">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <TrendingUp size={16} className={change.changePercentage >= 0 ? "text-neon-green" : "text-neon-red"} />
                                    <span className="font-bold text-white">{change.changeReason}</span>
                                </div>
                                <span className="text-xs text-gray-400">{new Date(change.effectiveDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <div className="text-gray-400">
                                    ${change.oldSalary.toLocaleString()} <span className="text-gray-600">→</span> <span className="text-white font-bold">${change.newSalary.toLocaleString()}</span>
                                </div>
                                <div className={`font-mono ${change.changePercentage >= 0 ? "text-neon-green" : "text-neon-red"}`}>
                                    {change.changePercentage > 0 ? '+' : ''}{change.changePercentage.toFixed(2)}%
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
