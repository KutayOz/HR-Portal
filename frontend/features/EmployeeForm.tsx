import React, { useState, useEffect } from 'react';
import { Modal } from '../components/Modal';
import { createEmployee, getDepartments } from '../services/api';
import { IDepartment } from '../types';

interface EmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    hireDate: new Date().toISOString().split('T')[0],
    departmentId: '',
    jobId: '',
    currentSalary: '',
    employmentStatus: 'Active',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: ''
  });

  useEffect(() => {
    if (isOpen) {
      getDepartments().then(setDepartments);
    }
  }, [isOpen]);

  const selectedDepartment = departments.find(d => d.id === formData.departmentId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = {
        ...formData,
        departmentId: parseInt(formData.departmentId.replace('D-', '')),
        jobId: parseInt(formData.jobId),
        currentSalary: parseFloat(formData.currentSalary)
      };

      await createEmployee(data);
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        dateOfBirth: '',
        hireDate: new Date().toISOString().split('T')[0],
        departmentId: '',
        jobId: '',
        currentSalary: '',
        employmentStatus: 'Active',
        address: '',
        city: '',
        state: '',
        postalCode: '',
        country: ''
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create employee');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Employee" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-neon-red/10 border border-neon-red/30 text-neon-red px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Personal Information */}
        <div>
          <h3 className="text-sm font-rajdhani font-bold text-neon-cyan mb-2 uppercase tracking-wider">Personal Information</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full bg-black/50 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:border-neon-cyan focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full bg-black/50 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:border-neon-cyan focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-black/50 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:border-neon-cyan focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Phone *</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                className="w-full bg-black/50 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:border-neon-cyan focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Birth Date *</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
                className="w-full bg-black/50 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:border-neon-cyan focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Hire Date *</label>
              <input
                type="date"
                name="hireDate"
                value={formData.hireDate}
                onChange={handleChange}
                required
                className="w-full bg-black/50 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:border-neon-cyan focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Employment Details */}
        <div>
          <h3 className="text-sm font-rajdhani font-bold text-neon-cyan mb-2 uppercase tracking-wider">Employment Details</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Department *</label>
              <select
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                required
                className="w-full bg-black/50 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:border-neon-cyan focus:outline-none"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Job Title *</label>
              <select
                name="jobId"
                value={formData.jobId}
                onChange={handleChange}
                required
                disabled={!selectedDepartment}
                className="w-full bg-black/50 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:border-neon-cyan focus:outline-none disabled:opacity-50"
              >
                <option value="">Select Job Title</option>
                {selectedDepartment?.jobs.map((job) => (
                  <option key={job.id} value={job.id}>{job.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Salary *</label>
              <input
                type="number"
                name="currentSalary"
                value={formData.currentSalary}
                onChange={handleChange}
                required
                step="any"
                className="w-full bg-black/50 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:border-neon-cyan focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Status *</label>
              <select
                name="employmentStatus"
                value={formData.employmentStatus}
                onChange={handleChange}
                required
                className="w-full bg-black/50 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:border-neon-cyan focus:outline-none"
              >
                <option value="Active">Active</option>
                <option value="OnLeave">On Leave</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Address (Optional) */}
        <div>
          <h3 className="text-sm font-rajdhani font-bold text-neon-cyan mb-2 uppercase tracking-wider">Address (Optional)</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3">
              <label className="block text-xs text-gray-400 mb-1">Street Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full bg-black/50 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:border-neon-cyan focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full bg-black/50 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:border-neon-cyan focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full bg-black/50 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:border-neon-cyan focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Postal/Country</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  placeholder="Postal"
                  className="w-1/2 bg-black/50 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:border-neon-cyan focus:outline-none"
                />
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Country"
                  className="w-1/2 bg-black/50 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:border-neon-cyan focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-1.5 text-sm bg-gradient-to-r from-neon-cyan to-neon-purple hover:shadow-[0_0_20px_rgba(0,243,255,0.5)] rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed font-orbitron"
          >
            {loading ? 'Creating...' : 'Create Employee'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
