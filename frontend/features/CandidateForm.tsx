import React, { useState, useEffect } from 'react';
import { Modal } from '../components/Modal';
import { createCandidate, createJobApplication, getJobs, getDepartments } from '../services/api';
import { IDepartment, IJob } from '../types';

interface CandidateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CandidateForm: React.FC<CandidateFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<IJob[]>([]);

  useEffect(() => {
    if (isOpen) {
      Promise.all([getDepartments(), getJobs()]).then(([depts, allJobs]) => {
        setDepartments(depts);
        setJobs(allJobs);
        setFilteredJobs(allJobs);
      });
    }
  }, [isOpen]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    linkedInProfile: '',
    resumePath: '',
    departmentId: '',
    jobId: ''
  });

  // Filter jobs when department changes
  useEffect(() => {
    if (formData.departmentId) {
      const deptId = parseInt(formData.departmentId.replace('D-', ''), 10);
      setFilteredJobs(jobs.filter(j => j.departmentId === deptId));
      // Reset job selection if not in filtered list
      const currentJobInDept = jobs.find(j => j.id === parseInt(formData.jobId) && j.departmentId === deptId);
      if (!currentJobInDept) {
        setFormData(prev => ({ ...prev, jobId: '' }));
      }
    } else {
      setFilteredJobs(jobs);
    }
  }, [formData.departmentId, jobs]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
        setError('First name, last name and email are required');
        setLoading(false);
        return;
      }

      const data = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim() || null,
        linkedInProfile: formData.linkedInProfile.trim() || null,
        resumePath: formData.resumePath.trim() || null,
      };

      const createdCandidate = await createCandidate(data);

      // Create job application with selected job
      if (createdCandidate?.id && formData.jobId) {
        try {
          const numericCandidateId = parseInt(String(createdCandidate.id).replace('C-', ''), 10);
          const jobId = parseInt(formData.jobId, 10);

          if (!Number.isNaN(numericCandidateId) && !Number.isNaN(jobId)) {
            await createJobApplication({
              candidateId: numericCandidateId,
              jobId: jobId,
              interviewNotes: null,
              expectedSalary: null,
            });
          }
        } catch (jobErr) {
          console.error('Failed to create job application for candidate', jobErr);
        }
      }

      onSuccess();
      onClose();

      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        linkedInProfile: '',
        resumePath: '',
        departmentId: '',
        jobId: ''
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create candidate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Candidate" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-neon-red/10 border border-neon-red/30 text-neon-red px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {jobs.length === 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 px-4 py-3 rounded-lg">
            Warning: No jobs found. Please create a job position first.
          </div>
        )}

        {/* Department & Job Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Department</label>
            <select
              name="departmentId"
              value={formData.departmentId}
              onChange={handleChange}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-neon-cyan focus:outline-none"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Position *</label>
            <select
              name="jobId"
              value={formData.jobId}
              onChange={handleChange}
              required
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-neon-cyan focus:outline-none"
            >
              <option value="">Select Position</option>
              {filteredJobs.map(job => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Personal Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">First Name *</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-neon-cyan focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Last Name *</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-neon-cyan focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-neon-cyan focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-neon-cyan focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">LinkedIn URL</label>
            <input
              type="url"
              name="linkedInProfile"
              value={formData.linkedInProfile}
              onChange={handleChange}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-neon-cyan focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Resume URL</label>
            <input
              type="url"
              name="resumePath"
              value={formData.resumePath}
              onChange={handleChange}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-neon-cyan focus:outline-none"
            />
          </div>
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
            {loading ? 'Creating...' : 'Create Candidate'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
