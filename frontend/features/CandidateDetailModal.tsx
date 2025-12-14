import React from 'react';
import { Modal } from '../components/Modal';
import { IJobApplication } from '../types';
import { User, Briefcase, Mail, Phone, Calendar, Linkedin, FileText, Award } from 'lucide-react';

interface CandidateDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: IJobApplication | null;
  onDelete: (id: string, skipConfirm?: boolean) => void;
}

export const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({
  isOpen,
  onClose,
  application,
  onDelete
}) => {
  if (!application) return null;

  const { candidate, position, status } = application;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Applied': return 'border-white/30 text-white bg-white/10';
      case 'Interview': return 'border-neon-cyan text-neon-cyan bg-neon-cyan/10';
      case 'Offered': return 'border-neon-purple text-neon-purple bg-neon-purple/10';
      case 'Hired': return 'border-neon-green text-neon-green bg-neon-green/10';
      default: return 'border-gray-500 text-gray-500 bg-gray-500/10';
    }
  };

  const handleDelete = () => {
    if (confirm('Bu adayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      onDelete(application.id, true); // skipConfirm=true since we already confirmed
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Candidate Details" size="md">
      <div className="space-y-6">
        {/* Header with Avatar */}
        <div className="flex items-center gap-4">
          <img
            src={candidate.avatarUrl}
            alt={`${candidate.firstName} ${candidate.lastName}`}
            className="w-20 h-20 rounded-full border-2 border-neon-cyan/30"
          />
          <div>
            <h2 className="text-xl font-orbitron font-bold text-white">
              {candidate.firstName} {candidate.lastName}
            </h2>
            <div className="text-sm text-neon-cyan font-mono">{position}</div>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-mono border ${getStatusColor(status)}`}>
              {status}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <Briefcase size={12} />
              <span>Position</span>
            </div>
            <div className="text-white font-medium">{position}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <Award size={12} />
              <span>Status</span>
            </div>
            <div className="text-white font-medium">{status}</div>
          </div>
        </div>

        {/* Skills */}
        {candidate.skills && candidate.skills.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {candidate.skills.map(skill => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Links */}
        <div className="flex gap-3">
          {candidate.linkedInUrl && candidate.linkedInUrl !== '#' && (
            <a
              href={candidate.linkedInUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 bg-blue-600/20 text-blue-400 text-sm rounded-lg flex items-center justify-center gap-2 border border-blue-600/30 hover:bg-blue-600/40 transition-colors"
            >
              <Linkedin size={16} /> LinkedIn Profile
            </a>
          )}
          {candidate.resumeUrl && candidate.resumeUrl !== '#' && (
            <a
              href={candidate.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 bg-white/10 text-white text-sm rounded-lg flex items-center justify-center gap-2 border border-white/20 hover:bg-white/20 transition-colors"
            >
              <FileText size={16} /> View Resume
            </a>
          )}
        </div>

        {/* Interview Notes */}
        {application.interviewNotes && (
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2">Interview Notes</h3>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10 text-gray-300 text-sm">
              {application.interviewNotes}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t border-white/10">
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-neon-red/10 text-neon-red border border-neon-red/30 rounded-lg hover:bg-neon-red/20 transition-colors text-sm"
          >
            Delete Candidate
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
