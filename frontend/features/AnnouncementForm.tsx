import React, { useState } from 'react';
import { Modal } from '../components/Modal';
import { createAnnouncement } from '../services/api';

interface AnnouncementFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AnnouncementForm: React.FC<AnnouncementFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    announcementType: 'General',
    priority: 'Normal',
    expiryDate: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await createAnnouncement(formData);
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        announcementType: 'General',
        priority: 'Normal',
        expiryDate: ''
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Announcement" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-neon-red/10 border border-neon-red/30 text-neon-red px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            maxLength={200}
            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-neon-cyan focus:outline-none"
            placeholder="Enter announcement title..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Content *</label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            required
            rows={6}
            maxLength={2000}
            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-neon-cyan focus:outline-none resize-none"
            placeholder="Enter announcement content..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Type *</label>
            <select
              name="announcementType"
              value={formData.announcementType}
              onChange={handleChange}
              required
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-neon-cyan focus:outline-none"
            >
              <option value="General">General</option>
              <option value="Urgent">Urgent</option>
              <option value="Event">Event</option>
              <option value="Holiday">Holiday</option>
              <option value="Policy">Policy</option>
              <option value="Achievement">Achievement</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Priority *</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              required
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-neon-cyan focus:outline-none"
            >
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Expiry Date (Optional)</label>
          <input
            type="date"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleChange}
            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-neon-cyan focus:outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">Leave empty for permanent announcement</p>
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
            {loading ? 'Creating...' : 'Create Announcement'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
