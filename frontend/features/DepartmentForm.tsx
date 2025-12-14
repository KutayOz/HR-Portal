import React, { useState, useEffect } from 'react';
import { Modal } from '../components/Modal';
import { createDepartment, updateDepartment } from '../services/api';
import { IDepartment } from '../types';
import { Plus, Trash2 } from 'lucide-react';

interface DepartmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editDepartment?: IDepartment | null;
}

interface JobInput {
  id?: number;
  title: string;
  minSalary: string;
  maxSalary: string;
}

export const DepartmentForm: React.FC<DepartmentFormProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  editDepartment 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    departmentName: editDepartment?.name || '',
    description: editDepartment?.description || ''
  });

  const [jobs, setJobs] = useState<JobInput[]>([]);

  // Initialize form data when editDepartment changes
  useEffect(() => {
    if (editDepartment) {
      setFormData({
        departmentName: editDepartment.name || '',
        description: editDepartment.description || ''
      });
      setJobs(
        editDepartment.jobs?.map(j => ({
          id: j.id,
          title: j.title,
          minSalary: j.minSalary ? j.minSalary.toString() : '',
          maxSalary: j.maxSalary ? j.maxSalary.toString() : ''
        })) || []
      );
    } else {
      setFormData({ departmentName: '', description: '' });
      setJobs([]);
    }
    setError('');
  }, [editDepartment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate jobs before submitting (salary is optional)
      if (jobs.length > 0) {
        for (const job of jobs) {
          if (!job.title || !job.title.trim()) {
            setError('All job positions must have a title');
            setLoading(false);
            return;
          }
        }
      }

      const buildJobsPayload = () => {
        if (jobs.length === 0) return [];

        return jobs.map((j) => {
          const hasMin = j.minSalary.trim() !== '';
          const hasMax = j.maxSalary.trim() !== '';

          const payload: any = {
            jobTitle: j.title.trim(),
          };

          if (hasMin) payload.minSalary = parseFloat(j.minSalary);
          if (hasMax) payload.maxSalary = parseFloat(j.maxSalary);

          if (editDepartment && j.id !== undefined) {
            (payload as any).id = j.id;
          }

          return payload;
        });
      };

      if (editDepartment) {
        await updateDepartment(editDepartment.id, {
          departmentName: formData.departmentName,
          description: formData.description,
          jobs: buildJobsPayload()
        });
      } else {
        await createDepartment({
          departmentName: formData.departmentName.trim(),
          description: formData.description?.trim() || '',
          jobs: buildJobsPayload()
        });
      }

      onSuccess();
      onClose();
      
      // Reset form
      setFormData({ departmentName: '', description: '' });
      setJobs([]);
    } catch (err: any) {
      setError(err.message || `Failed to ${editDepartment ? 'update' : 'create'} department`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addJob = () => {
    setJobs([...jobs, { title: '', minSalary: '', maxSalary: '' }]);
  };

  const removeJob = (index: number) => {
    setJobs(jobs.filter((_, i) => i !== index));
  };

  const updateJob = (index: number, field: 'title' | 'minSalary' | 'maxSalary', value: string) => {
    const updatedJobs = [...jobs];
    updatedJobs[index][field] = value;
    setJobs(updatedJobs);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editDepartment ? 'Edit Department' : 'Add New Department'} 
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-neon-red/10 border border-neon-red/30 text-neon-red px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Department Information */}
        <div>
          <h3 className="text-lg font-rajdhani font-bold text-neon-cyan mb-4">Department Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Department Name *</label>
              <input
                type="text"
                name="departmentName"
                value={formData.departmentName}
                onChange={handleChange}
                required
                maxLength={100}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-neon-cyan focus:outline-none"
                placeholder="e.g., Engineering, Marketing, Sales"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                maxLength={500}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-neon-cyan focus:outline-none resize-none"
                placeholder="Brief description of the department..."
              />
            </div>
          </div>
        </div>

        {/* Job Positions (Only for new departments) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-rajdhani font-bold text-neon-purple">Job Positions (Optional)</h3>
            <button
              type="button"
              onClick={addJob}
              className="flex items-center gap-2 px-3 py-1 bg-neon-purple/20 hover:bg-neon-purple/30 border border-neon-purple/50 rounded-lg transition-colors text-sm"
            >
              <Plus size={16} /> Add Position
            </button>
          </div>

            {jobs.length === 0 ? (
              <div className="text-center py-6 bg-white/5 rounded-lg border border-dashed border-white/10">
                <p className="text-gray-500 text-sm">No job positions added. Click "Add Position" to add roles.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map((job, index) => (
                  <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Job Title *</label>
                          <input
                            type="text"
                            value={job.title}
                            onChange={(e) => updateJob(index, 'title', e.target.value)}
                            required={jobs.length > 0}
                            className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-neon-cyan focus:outline-none"
                            placeholder="e.g., Senior Developer"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Min Salary</label>
                          <input
                            type="number"
                            value={job.minSalary}
                            onChange={(e) => updateJob(index, 'minSalary', e.target.value)}
                            step="any"
                            className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-neon-cyan focus:outline-none"
                            placeholder="50000"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Max Salary</label>
                          <input
                            type="number"
                            value={job.maxSalary}
                            onChange={(e) => updateJob(index, 'maxSalary', e.target.value)}
                            step="any"
                            className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-neon-cyan focus:outline-none"
                            placeholder="100000"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeJob(index)}
                        className="mt-6 p-2 text-neon-red hover:bg-neon-red/10 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              {editDepartment
                ? 'You can update job titles and salary ranges for this department.'
                : '💡 You can add job positions later if needed. These help define roles within the department.'}
            </p>
          </div>

        {/* Actions */}
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
            {loading ? (editDepartment ? 'Updating...' : 'Creating...') : (editDepartment ? 'Update Department' : 'Create Department')}
          </button>
        </div>
      </form>
    </Modal>
  );
};
