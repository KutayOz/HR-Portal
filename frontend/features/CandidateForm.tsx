import React, { useState, useEffect } from 'react';
import { Modal } from '../components/Modal';
import { createCandidate, createJobApplication, getJobs } from '../services/api';

interface CandidateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CandidateForm: React.FC<CandidateFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasJobs, setHasJobs] = useState(true);

  useEffect(() => {
    if (isOpen) {
      getJobs().then(jobs => {
        setHasJobs(Array.isArray(jobs) && jobs.length > 0);
      });
    }
  }, [isOpen]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    skills: '',
    linkedInProfile: '',
    resumePath: '',
    yearsOfExperience: ''
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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

      const years = formData.yearsOfExperience.trim()
        ? parseInt(formData.yearsOfExperience.trim(), 10)
        : undefined;

      const data = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim() || null,
        skills: formData.skills.trim() || null,
        linkedInProfile: formData.linkedInProfile.trim() || null,
        resumePath: formData.resumePath.trim() || null,
        yearsOfExperience: Number.isNaN(years) ? undefined : years,
      };

      const createdCandidate = await createCandidate(data);

      try {
        const jobs = await getJobs();

        if (Array.isArray(jobs) && jobs.length > 0 && createdCandidate?.id) {
          const numericCandidateId = parseInt(String(createdCandidate.id).replace('C-', ''), 10);
          const defaultJob = jobs[0] as any;
          const defaultJobId = defaultJob?.id;

          if (!Number.isNaN(numericCandidateId) && typeof defaultJobId === 'number') {
            await createJobApplication({
              candidateId: numericCandidateId,
              jobId: defaultJobId,
              interviewNotes: null,
              expectedSalary: null,
            });
          }
        }
      } catch (jobErr) {
        console.error('Failed to create default job application for candidate', jobErr);
      }

      onSuccess();
      onClose();

      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        skills: '',
        linkedInProfile: '',
        resumePath: '',
        yearsOfExperience: ''
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

        {!hasJobs && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 px-4 py-3 rounded-lg">
            Warning: No jobs found. Candidate will be created but not assigned to any job application.
          </div>
        )}

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

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Skills (comma separated)</label>
          <textarea
            name="skills"
            value={formData.skills}
            onChange={handleChange}
            rows={3}
            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-neon-cyan focus:outline-none resize-none"
            placeholder="e.g. React, .NET, PostgreSQL"
          />
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

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Years of Experience</label>
          <input
            type="number"
            name="yearsOfExperience"
            value={formData.yearsOfExperience}
            onChange={handleChange}
            min="0"
            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-neon-cyan focus:outline-none"
          />
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
