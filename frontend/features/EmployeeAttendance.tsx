import React, { useState, useEffect } from 'react';
import { Clock, Plus, Calendar } from 'lucide-react';
import { getAttendanceRecordsByEmployee, createAttendanceRecord } from '../services/api';
import { NeonButton } from '../components/ui';

interface EmployeeAttendanceProps {
    employeeId: number;
    readOnly?: boolean;
    readOnlyReason?: 'switch' | 'request';
    onRequestAccess?: () => Promise<void>;
}

export const EmployeeAttendance: React.FC<EmployeeAttendanceProps> = ({ employeeId, readOnly = false, readOnlyReason, onRequestAccess }) => {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        checkInTime: '09:00',
        checkOutTime: '17:00',
        status: 'Present',
        remarks: ''
    });

    const loadRecords = () => {
        setLoading(true);
        getAttendanceRecordsByEmployee(employeeId).then(data => {
            setRecords(data);
            setLoading(false);
        });
    };

    useEffect(() => {
        loadRecords();
    }, [employeeId]);

    useEffect(() => {
        if (readOnly) {
            setShowForm(false);
        }
    }, [readOnly]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createAttendanceRecord({
                employeeId,
                ...formData
            });
            setShowForm(false);
            loadRecords();
        } catch (error) {
            console.error('Failed to record attendance', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Present': return 'text-neon-green bg-neon-green/10 border-neon-green/30';
            case 'Absent': return 'text-neon-red bg-neon-red/10 border-neon-red/30';
            case 'Late': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
            case 'HalfDay': return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
            default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
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
                <h3 className="text-lg font-orbitron text-neon-cyan">Attendance Records</h3>
                {!readOnly && (
                    <NeonButton onClick={() => setShowForm(!showForm)} icon={Plus}>
                        Log Attendance
                    </NeonButton>
                )}
            </div>

            {!readOnly && showForm && (
                <form onSubmit={handleSubmit} className="bg-white/5 p-4 rounded-lg border border-white/10 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            type="date"
                            className="bg-black/50 border border-white/10 rounded px-3 py-2 text-white"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                            required
                        />
                        <select
                            className="bg-black/50 border border-white/10 rounded px-3 py-2 text-white"
                            value={formData.status}
                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                        >
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            <option value="Late">Late</option>
                            <option value="HalfDay">Half Day</option>
                            <option value="OnLeave">On Leave</option>
                        </select>
                        <input
                            type="time"
                            className="bg-black/50 border border-white/10 rounded px-3 py-2 text-white"
                            value={formData.checkInTime}
                            onChange={e => setFormData({ ...formData, checkInTime: e.target.value })}
                            required
                        />
                        <input
                            type="time"
                            className="bg-black/50 border border-white/10 rounded px-3 py-2 text-white"
                            value={formData.checkOutTime}
                            onChange={e => setFormData({ ...formData, checkOutTime: e.target.value })}
                        />
                    </div>
                    <input
                        type="text"
                        placeholder="Remarks"
                        className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white"
                        value={formData.remarks}
                        onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                    />
                    <div className="flex justify-end">
                        <button type="submit" className="bg-neon-cyan/20 text-neon-cyan px-4 py-2 rounded hover:bg-neon-cyan/30 transition-colors">
                            Save Record
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                    <div className="text-center text-gray-500">Loading records...</div>
                ) : records.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">No attendance records found</div>
                ) : (
                    records.map(record => (
                        <div key={record.id} className="bg-white/5 p-3 rounded-lg border border-white/10 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/5 p-2 rounded">
                                    <Calendar size={16} className="text-gray-400" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white">{new Date(record.date).toLocaleDateString()}</div>
                                    <div className="text-xs text-gray-400 flex items-center gap-1">
                                        <Clock size={10} />
                                        {record.checkInTime} - {record.checkOutTime || '---'}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className={`text-xs px-2 py-0.5 rounded border ${getStatusColor(record.status)}`}>
                                    {record.status}
                                </span>
                                {record.totalHours > 0 && (
                                    <span className="text-xs text-gray-500 font-mono">{record.totalHours.toFixed(1)}h</span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
