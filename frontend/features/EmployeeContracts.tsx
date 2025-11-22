import React, { useState, useEffect } from 'react';
import { FileText, Plus, Download } from 'lucide-react';
import { getContractsByEmployee, createContract } from '../services/api';
import { NeonButton } from '../components/ui';

interface EmployeeContractsProps {
    employeeId: number;
}

export const EmployeeContracts: React.FC<EmployeeContractsProps> = ({ employeeId }) => {
    const [contracts, setContracts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        contractType: 'FullTime',
        startDate: '',
        salary: '',
        workingHoursPerWeek: 40,
        terms: ''
    });

    const loadContracts = () => {
        setLoading(true);
        getContractsByEmployee(employeeId).then(data => {
            setContracts(data);
            setLoading(false);
        });
    };

    useEffect(() => {
        loadContracts();
    }, [employeeId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createContract({
                employeeId,
                ...formData,
                salary: parseFloat(formData.salary),
                workingHoursPerWeek: parseInt(formData.workingHoursPerWeek.toString())
            });
            setShowForm(false);
            loadContracts();
        } catch (error) {
            console.error('Failed to create contract', error);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-orbitron text-neon-cyan">Employment Contracts</h3>
                <NeonButton onClick={() => setShowForm(!showForm)} icon={Plus}>
                    New Contract
                </NeonButton>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white/5 p-4 rounded-lg border border-white/10 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            type="text"
                            placeholder="Contract Type"
                            className="bg-black/50 border border-white/10 rounded px-3 py-2 text-white"
                            value={formData.contractType}
                            onChange={e => setFormData({ ...formData, contractType: e.target.value })}
                            required
                        />
                        <input
                            type="date"
                            className="bg-black/50 border border-white/10 rounded px-3 py-2 text-white"
                            value={formData.startDate}
                            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                            required
                        />
                        <input
                            type="number"
                            placeholder="Salary"
                            className="bg-black/50 border border-white/10 rounded px-3 py-2 text-white"
                            value={formData.salary}
                            onChange={e => setFormData({ ...formData, salary: e.target.value })}
                            required
                        />
                        <input
                            type="number"
                            placeholder="Hours/Week"
                            className="bg-black/50 border border-white/10 rounded px-3 py-2 text-white"
                            value={formData.workingHoursPerWeek}
                            onChange={e => setFormData({ ...formData, workingHoursPerWeek: parseInt(e.target.value) || 0 })}
                            required
                        />
                    </div>
                    <textarea
                        placeholder="Terms & Conditions"
                        className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white"
                        value={formData.terms}
                        onChange={e => setFormData({ ...formData, terms: e.target.value })}
                    />
                    <div className="flex justify-end">
                        <button type="submit" className="bg-neon-cyan/20 text-neon-cyan px-4 py-2 rounded hover:bg-neon-cyan/30 transition-colors">
                            Save Contract
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-3">
                {loading ? (
                    <div className="text-center text-gray-500">Loading contracts...</div>
                ) : contracts.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">No contracts found</div>
                ) : (
                    contracts.map(contract => (
                        <div key={contract.id} className="bg-white/5 p-4 rounded-lg border border-white/10 flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-2">
                                    <FileText size={16} className="text-neon-purple" />
                                    <span className="font-bold text-white">{contract.contractType}</span>
                                    {contract.isActive && <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded">Active</span>}
                                </div>
                                <div className="text-sm text-gray-400 mt-1">
                                    Started: {new Date(contract.startDate).toLocaleDateString()} • Salary: ${contract.salary.toLocaleString()}
                                </div>
                            </div>
                            <button className="text-gray-400 hover:text-white">
                                <Download size={18} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
