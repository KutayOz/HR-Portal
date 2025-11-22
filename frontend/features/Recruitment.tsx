
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, GripVertical, CheckCircle2, XCircle, Linkedin, FileText } from 'lucide-react';
import { NeonButton, SectionHeader } from '../components/ui';
import { IJobApplication } from '../types';
import { getApplications, getCandidates } from '../services/api';
import { CandidateForm } from './CandidateForm';

interface RecruitmentProps {
  onBack: () => void;
}

const COLUMNS = [
  { id: 'Applied', title: 'Applied', color: 'border-white/20' },
  { id: 'Interview', title: 'Interview', color: 'border-neon-cyan/50' },
  { id: 'Offered', title: 'Offer Stage', color: 'border-neon-purple/50' },
  { id: 'Hired', title: 'Hired', color: 'border-neon-green/50' },
];

export const Recruitment: React.FC<RecruitmentProps> = ({ onBack }) => {
  const [applications, setApplications] = useState<IJobApplication[]>([]);
  const [showCandidateForm, setShowCandidateForm] = useState(false);

  const fetchData = async () => {
    try {
      const [appsData, candidatesData] = await Promise.all([
        getApplications(),
        getCandidates()
      ]);

      // Create a set of candidate IDs that already have applications
      // Handle potential different ID formats (though they should match as C-XXX)
      const appliedCandidateIds = new Set(appsData.map(app => app.candidate.id));

      // Filter candidates who don't have an application
      const orphanCandidates = candidatesData.filter((c: any) => !appliedCandidateIds.has(c.id));

      // Create temporary application objects for orphan candidates
      const orphanApps: IJobApplication[] = orphanCandidates.map((c: any) => ({
        id: `temp-${c.id}`,
        candidateId: c.id,
        candidate: c,
        position: 'Unassigned',
        departmentId: 'Unassigned',
        status: 'Applied',
        expectedSalary: 0,
        matchScore: 0
      }));

      setApplications([...appsData, ...orphanApps]);
    } catch (error) {
      console.error("Error fetching recruitment data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const moveCandidate = (id: string, direction: 'next' | 'prev') => {
    setApplications(prev => prev.map(app => {
      if (app.id !== id) return app;

      const currentIndex = COLUMNS.findIndex(col => col.id === app.status);
      let nextIndex = currentIndex;

      if (direction === 'next' && currentIndex < COLUMNS.length - 1) nextIndex++;
      if (direction === 'prev' && currentIndex > 0) nextIndex--;

      return { ...app, status: COLUMNS[nextIndex].id as any };
    }));
  };

  return (
    <div className="min-h-[80vh]">
      <CandidateForm
        isOpen={showCandidateForm}
        onClose={() => setShowCandidateForm(false)}
        onSuccess={() => {
          // Refresh both applications and candidates
          fetchData();
        }}
      />
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <NeonButton onClick={onBack} variant="ghost" icon={ArrowLeft}>
            Back
          </NeonButton>
        </div>
        <NeonButton icon={Plus} variant="primary" onClick={() => setShowCandidateForm(true)}>
          Add Candidate
        </NeonButton>
      </div>

      <SectionHeader title="Recruitment Nexus" subtitle="Pipeline Visualization" />

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 overflow-x-auto pb-4">
        {COLUMNS.map((column) => (
          <div key={column.id} className="min-w-[280px] flex flex-col h-[600px]">
            {/* Column Header */}
            <div className={`p-4 mb-4 rounded-lg border-b-2 bg-white/5 backdrop-blur-sm flex justify-between items-center ${column.color}`}>
              <h3 className="font-orbitron font-bold text-sm tracking-wider text-white">{column.title}</h3>
              <span className="text-xs font-mono text-gray-400 bg-black/40 px-2 py-1 rounded">
                {applications.filter(app => app.status === column.id).length}
              </span>
            </div>

            {/* Column Content */}
            <div className="flex-1 bg-white/5 rounded-xl p-2 space-y-3 overflow-y-auto custom-scrollbar border border-white/5">
              <AnimatePresence>
                {applications.filter(app => app.status === column.id).map((app) => (
                  <motion.div
                    layoutId={app.id}
                    key={app.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="bg-[#0a0a15] border border-white/10 p-4 rounded-lg shadow-lg group hover:border-neon-cyan/40 transition-colors relative"
                  >
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <img src={app.candidate.avatarUrl} alt="av" className="w-10 h-10 rounded-full border border-gray-600" />
                      <div>
                        <div className="text-sm font-bold text-white">{app.candidate.firstName} {app.candidate.lastName}</div>
                        <div className="text-[10px] text-neon-cyan font-mono uppercase">{app.position}</div>
                      </div>
                    </div>

                    {/* Match Score */}
                    <div className="mb-3">
                      <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                        <span>AI MATCH</span>
                        <span>{app.matchScore}%</span>
                      </div>
                      <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${app.matchScore > 90 ? 'bg-neon-green' : app.matchScore > 70 ? 'bg-neon-cyan' : 'bg-yellow-500'}`}
                          style={{ width: `${app.matchScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Skills Cloud */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {app.candidate.skills.slice(0, 3).map(skill => (
                        <span key={skill} className="text-[9px] px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-gray-400">
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Links */}
                    <div className="flex gap-2 mb-4">
                      <button className="flex-1 py-1 bg-blue-600/20 text-blue-400 text-[10px] rounded flex items-center justify-center gap-1 border border-blue-600/30 hover:bg-blue-600/40">
                        <Linkedin size={12} /> Profile
                      </button>
                      <button className="flex-1 py-1 bg-white/10 text-white text-[10px] rounded flex items-center justify-center gap-1 border border-white/20 hover:bg-white/20">
                        <FileText size={12} /> Packet
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity border-t border-white/5 pt-2">
                      <button
                        onClick={() => moveCandidate(app.id, 'prev')}
                        disabled={column.id === 'Applied'}
                        className="p-1 hover:bg-white/10 rounded text-gray-400 disabled:opacity-20"
                      >
                        <XCircle size={16} />
                      </button>
                      <GripVertical size={16} className="text-gray-600 cursor-grab active:cursor-grabbing" />
                      <button
                        onClick={() => moveCandidate(app.id, 'next')}
                        disabled={column.id === 'Hired'}
                        className="p-1 hover:bg-white/10 rounded text-neon-green disabled:opacity-20"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {applications.filter(app => app.status === column.id).length === 0 && (
                <div className="text-center py-8 opacity-20 text-sm font-rajdhani border-2 border-dashed border-gray-700 rounded-lg">
                  NO DATA PACKETS
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
