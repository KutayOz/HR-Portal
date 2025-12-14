
import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Search, SlidersHorizontal, ArrowUpDown, X } from 'lucide-react';
import { NeonButton, SectionHeader } from '../components/ui';
import { IJobApplication, IDepartment } from '../types';
import { getApplications, getCandidatesScoped, updateJobApplication, deleteJobApplication, createEmployee, getDepartments, createJobApplication, getJobs, deleteCandidate, createAccessRequest, getAccessOutbox } from '../services/api';
import { CandidateForm } from './CandidateForm';
import { CandidateDetailModal } from './CandidateDetailModal';
import { AppliedCard, InterviewCard, OfferedCard, HiredCard, ContractData, EmployeeData, getAIScore, getSupervisorRating } from './RecruitmentCards';

interface RecruitmentProps {
  onBack: () => void;
}

const COLUMNS = [
  { id: 'Applied', title: 'Applied', color: 'border-white/20' },
  { id: 'Interview', title: 'Interview', color: 'border-neon-cyan/50' },
  { id: 'Offered', title: 'Offer Stage', color: 'border-neon-purple/50' },
  { id: 'Hired', title: 'Hired', color: 'border-neon-green/50' },
];

// Sort Type
type SortOption = 'none' | 'ai-desc' | 'ai-asc' | 'supervisor-desc' | 'supervisor-asc';

export const Recruitment: React.FC<RecruitmentProps> = ({ onBack }) => {
  const [applications, setApplications] = useState<IJobApplication[]>([]);
  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<IJobApplication | null>(null);
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [scope, setScope] = useState<'all' | 'yours'>('yours');
  
  // Sorting state
  const [appliedSort, setAppliedSort] = useState<SortOption>('none');
  const [interviewSort, setInterviewSort] = useState<SortOption>('none');
  
  // Filter state - slider values (minimum thresholds)
  const [appliedMinAI, setAppliedMinAI] = useState(0); // 0-100
  const [interviewMinAI, setInterviewMinAI] = useState(0); // 0-100
  const [interviewMinSupervisor, setInterviewMinSupervisor] = useState(1); // 1-5
  
  const [showAppliedControls, setShowAppliedControls] = useState(false);
  const [showInterviewControls, setShowInterviewControls] = useState(false);

  const filteredApplications = applications.filter(app =>
    app.candidate?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.candidate?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper: Apply sort to applications
  const applySort = (apps: IJobApplication[], sort: SortOption): IJobApplication[] => {
    const sorted = [...apps];
    switch (sort) {
      case 'ai-desc':
        return sorted.sort((a, b) => (b.matchScore || getAIScore(b.candidateId)) - (a.matchScore || getAIScore(a.candidateId)));
      case 'ai-asc':
        return sorted.sort((a, b) => (a.matchScore || getAIScore(a.candidateId)) - (b.matchScore || getAIScore(b.candidateId)));
      case 'supervisor-desc':
        return sorted.sort((a, b) => getSupervisorRating(b.candidateId) - getSupervisorRating(a.candidateId));
      case 'supervisor-asc':
        return sorted.sort((a, b) => getSupervisorRating(a.candidateId) - getSupervisorRating(b.candidateId));
      default:
        return sorted;
    }
  };

  // Get processed applications for each column
  const getColumnApplications = (columnId: string): IJobApplication[] => {
    let apps = filteredApplications.filter(app => app.status === columnId);
    
    if (columnId === 'Applied') {
      // Apply AI score filter
      if (appliedMinAI > 0) {
        apps = apps.filter(app => (app.matchScore || getAIScore(app.candidateId)) >= appliedMinAI);
      }
      apps = applySort(apps, appliedSort);
    } else if (columnId === 'Interview') {
      // Apply AI score filter
      if (interviewMinAI > 0) {
        apps = apps.filter(app => (app.matchScore || getAIScore(app.candidateId)) >= interviewMinAI);
      }
      // Apply supervisor rating filter
      if (interviewMinSupervisor > 1) {
        apps = apps.filter(app => getSupervisorRating(app.candidateId) >= interviewMinSupervisor);
      }
      apps = applySort(apps, interviewSort);
    }
    
    return apps;
  };

  const getAdminId = (): string | null => {
    try {
      return localStorage.getItem('adminId');
    } catch {
      return null;
    }
  };

  const hasActiveApproval = async (resourceType: string, resourceId: string): Promise<boolean> => {
    const outbox = await getAccessOutbox();
    const now = Date.now();
    return outbox.some(r =>
      r.resourceType === resourceType &&
      r.resourceId === resourceId &&
      r.status === 'Approved' &&
      r.allowedUntil &&
      new Date(r.allowedUntil).getTime() > now);
  };

  const isOwnedByCurrentAdmin = (app: IJobApplication, adminId: string | null): boolean => {
    if (!adminId) return false;
    if (app.ownerAdminId) return app.ownerAdminId === adminId;
    if (app.candidate?.ownerAdminId) return app.candidate.ownerAdminId === adminId;
    return false;
  };

  const fetchData = async () => {
    try {
      const [appsData, candidatesData, deptsData] = await Promise.all([
        getApplications(scope),
        getCandidatesScoped(scope),
        getDepartments()
      ]);
      
      setDepartments(deptsData);

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
  }, [scope]);

  // Applied -> Interview advancement
  const handleAppliedAdvance = async (id: string) => {
    console.log('handleAppliedAdvance called with id:', id);
    
    const app = applications.find(a => a.id === id);
    if (!app) {
      console.log('App not found for id:', id);
      return;
    }

    const candidateName = `${app.candidate.firstName} ${app.candidate.lastName}`;
    console.log('Showing confirm for:', candidateName);
    
    const confirmed = confirm(`"${candidateName}" adayı "Interview" aşamasına ilerleyecek. Emin misiniz?`);
    console.log('User confirmed:', confirmed);
    
    if (!confirmed) return;

    console.log('Calling updateApplicationStatus...');
    await updateApplicationStatus(id, 'Interview');
    console.log('updateApplicationStatus completed');
  };

  // Interview -> Offered advancement (with supervisor rating)
  const handleInterviewAdvance = async (id: string, supervisorRating: number, supervisorNotes: string) => {
    const app = applications.find(a => a.id === id);
    if (!app) return;

    const adminId = getAdminId();
    if (scope === 'all') {
      if (isOwnedByCurrentAdmin(app, adminId)) {
        alert('Switch to "Yours" to modify your own recruitment items.');
        return;
      }

      const resourceType = id.startsWith('temp-') ? 'Candidate' : 'JobApplication';
      const resourceId = id.startsWith('temp-') ? app.candidateId : id;
      if (await hasActiveApproval(resourceType, resourceId)) {
        // allowed
      } else {
        try {
          await createAccessRequest(resourceType, resourceId, `${adminId ?? 'admin'} wants access to your ${resourceType}`);
          alert('Access request sent to the responsible admin.');
        } catch (e: any) {
          alert(e?.message || 'Failed to send access request');
        }
        return;
      }
    }

    const candidateName = `${app.candidate.firstName} ${app.candidate.lastName}`;
    const confirmed = confirm(`"${candidateName}" adayı "Offered" aşamasına ilerleyecek (Puan: ${supervisorRating}/5). Emin misiniz?`);
    if (!confirmed) return;

    await updateApplicationStatus(id, 'Offered', supervisorNotes);
  };

  // Offered -> Hired advancement (with contract data)
  const handleOfferedAdvance = async (id: string, contractData: ContractData) => {
    const app = applications.find(a => a.id === id);
    if (!app) return;

    const candidateName = `${app.candidate.firstName} ${app.candidate.lastName}`;
    const confirmed = confirm(`"${candidateName}" adayına ${contractData.salary} ${contractData.currency} maaşlı teklif onaylanacak. Emin misiniz?`);
    if (!confirmed) return;

    await updateApplicationStatus(id, 'Hired', `Contract: ${contractData.contractType}, Salary: ${contractData.salary} ${contractData.currency}`, contractData.salary);
  };

  // Hired -> Employee (final confirmation)
  const handleHiredConfirm = async (id: string, employeeData: EmployeeData) => {
    const app = applications.find(a => a.id === id);
    if (!app) return;

    const candidateName = `${app.candidate.firstName} ${app.candidate.lastName}`;
    const confirmed = confirm(`"${candidateName}" artık resmi personel olarak kaydedilecek ve recruitment listesinden silinecek. Emin misiniz?`);
    if (!confirmed) return;

    try {
      // Get jobId from application or find a valid one
      let jobId = app.jobId;
      if (!jobId) {
        try {
          const jobsData = await getJobs();
          if (jobsData && jobsData.length > 0) {
            jobId = jobsData[0].id;
          }
        } catch (e) {
          console.log('Could not fetch jobs, using default');
        }
      }
      if (!jobId) jobId = 1;

      // Create employee record
      await createEmployee({
        firstName: app.candidate.firstName,
        lastName: app.candidate.lastName,
        email: employeeData.email,
        phoneNumber: employeeData.phoneNumber,
        departmentId: parseInt(app.departmentId.replace('D-', ''), 10) || 1,
        jobId: jobId,
        employmentStatus: 'Active',
        currentSalary: employeeData.currentSalary,
        hireDate: employeeData.hireDate,
        address: employeeData.address,
        city: employeeData.city,
        state: employeeData.state,
        postalCode: employeeData.postalCode,
        country: employeeData.country,
        dateOfBirth: employeeData.dateOfBirth
      });

      // Delete from recruitment
      if (!id.startsWith('temp-')) {
        await deleteJobApplication(id);
        const candidateId = parseInt(app.candidateId.replace('C-', ''), 10);
        if (!Number.isNaN(candidateId)) {
          await deleteCandidate(candidateId);
        }
      }
      
      setApplications(prev => prev.filter(a => a.id !== id));
      alert(`${candidateName} başarıyla personel listesine eklendi!`);
    } catch (error) {
      console.error('Failed to create employee:', error);
      alert('Personel oluşturulurken hata oluştu');
    }
  };

  // Generic status update helper
  const updateApplicationStatus = async (id: string, newStatus: string, notes?: string, offeredSalary?: number) => {
    console.log('updateApplicationStatus called:', { id, newStatus, notes });
    
    const app = applications.find(a => a.id === id);
    if (!app) {
      console.log('Application not found:', id);
      return;
    }

    const adminId = getAdminId();

    if (scope === 'all') {
      if (isOwnedByCurrentAdmin(app, adminId)) {
        alert('Switch to "Yours" to modify your own recruitment items.');
        return;
      }

      const resourceType = id.startsWith('temp-') ? 'Candidate' : 'JobApplication';
      const resourceId = id.startsWith('temp-') ? app.candidateId : id;
      if (await hasActiveApproval(resourceType, resourceId)) {
        // allowed
      } else {
        try {
          await createAccessRequest(resourceType, resourceId, `${adminId ?? 'admin'} wants access to your ${resourceType}`);
          alert('Access request sent to the responsible admin.');
        } catch (e: any) {
          alert(e?.message || 'Failed to send access request');
        }
        return;
      }
    }

    console.log('Found application:', app);
    const previousStatus = app.status;
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status: newStatus as any } : a));

    try {
      // For temp applications, we need to create a real job application first
      if (id.startsWith('temp-')) {
        console.log('Processing temp application...');
        const candidateId = parseInt(app.candidateId.replace('C-', ''), 10);
        
        // Get a default job if position is unassigned
        let jobId = 3; // Default job ID
        try {
          const jobsData = await getJobs();
          if (jobsData && jobsData.length > 0) {
            jobId = jobsData[0].id;
          }
        } catch (e) {
          console.log('Using default job ID');
        }

        // Create the job application
        const created = await createJobApplication({
          candidateId: candidateId,
          jobId: jobId,
          interviewNotes: notes || '',
          expectedSalary: app.expectedSalary || 0
        });

        if (created) {
          // Update with new status
          const updated = await updateJobApplication(created.id, {
            status: newStatus,
            interviewNotes: notes || null
          });

          // Replace temp app with real app
          setApplications(prev => prev.map(a => a.id === id ? { ...updated, status: newStatus as any } : a));
          console.log('Created real application from temp:', created.id);
        }
      } else {
        console.log('Updating existing application:', id);
        const updated = await updateJobApplication(id, {
          status: newStatus,
          interviewNotes: notes || app.interviewNotes || null,
          offeredSalary: offeredSalary
        });
        console.log('Update result:', updated);
        if (updated) {
          setApplications(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
          console.log('State updated successfully');
        }
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status: previousStatus as any } : a));
    }
  };

  const handleDeleteApplication = async (id: string, skipConfirm: boolean = false) => {
    if (!skipConfirm && !confirm('Bu adayı silmek istediğinize emin misiniz?')) return;
    
    const app = applications.find(a => a.id === id);
    if (!app) return;

    const adminId = getAdminId();

    if (scope === 'all') {
      if (isOwnedByCurrentAdmin(app, adminId)) {
        alert('Switch to "Yours" to modify your own recruitment items.');
        return;
      }

      const resourceType = id.startsWith('temp-') ? 'Candidate' : 'JobApplication';
      const resourceId = id.startsWith('temp-') ? app.candidateId : id;
      if (await hasActiveApproval(resourceType, resourceId)) {
        // allowed
      } else {
        try {
          await createAccessRequest(resourceType, resourceId, `${adminId ?? 'admin'} wants access to your ${resourceType}`);
          alert('Access request sent to the responsible admin.');
        } catch (e: any) {
          alert(e?.message || 'Failed to send access request');
        }
        return;
      }
    }
    
    console.log('Deleting application with id:', id);
    
    // Optimistic removal
    setApplications(prev => prev.filter(a => a.id !== id));

    try {
      if (id.startsWith('temp-')) {
        // For temp applications, delete the candidate directly
        const candidateId = parseInt(app.candidateId.replace('C-', ''), 10);
        if (app.candidate?.ownerAdminId && adminId && app.candidate.ownerAdminId !== adminId) {
          console.log('Skip deleting non-owned candidate:', candidateId);
        } else {
          await deleteCandidate(candidateId);
          console.log('Deleted orphan candidate:', candidateId);
        }
      } else {
        // Delete the job application (and optionally the candidate)
        await deleteJobApplication(id);
        const candidateId = parseInt(app.candidateId.replace('C-', ''), 10);
        if (!Number.isNaN(candidateId)) {
          if (app.candidate?.ownerAdminId && adminId && app.candidate.ownerAdminId !== adminId) {
            console.log('Skip deleting non-owned candidate for application:', candidateId);
          } else {
            await deleteCandidate(candidateId);
            console.log('Deleted candidate for application:', candidateId);
          }
        }
        console.log('Successfully deleted application:', id);
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      // Refresh data on error
      fetchData();
    }
  };

  return (
    <div className="min-h-[80vh]">
      <CandidateForm
        isOpen={showCandidateForm}
        onClose={() => setShowCandidateForm(false)}
        onSuccess={() => fetchData()}
      />

      <CandidateDetailModal
        isOpen={selectedApplication !== null}
        onClose={() => setSelectedApplication(null)}
        application={selectedApplication}
        onDelete={handleDeleteApplication}
      />
      <div className="flex items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <NeonButton onClick={onBack} variant="ghost" icon={ArrowLeft}>
            Back
          </NeonButton>
          <NeonButton
            icon={Plus}
            onClick={() => {
              if (scope === 'all') {
                alert('Switch to "Yours" to add candidates.');
                return;
              }
              setShowCandidateForm(true);
            }}
          >
            Add Candidate
          </NeonButton>
        </div>

        <div className="inline-flex rounded-lg border border-white/10 overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setScope('yours')}
            className={`px-3 py-1 transition-colors ${scope === 'yours' ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            Yours
          </button>
          <button
            type="button"
            onClick={() => setScope('all')}
            className={`px-3 py-1 transition-colors border-l border-white/10 ${scope === 'all' ? 'bg-neon-purple/20 text-neon-purple' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            All
          </button>
        </div>

        {/* Search Box */}
        <div className="relative w-64 md:w-96">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neon-cyan">
            <span className="font-mono text-sm">{'>'}</span>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full p-2 pl-8 text-sm font-mono bg-black/50 border border-neon-cyan/30 rounded-sm text-white focus:ring-1 focus:ring-neon-cyan focus:border-neon-cyan placeholder-gray-600"
            placeholder="SEARCH_CANDIDATE_"
          />
          <Search className="absolute right-3 top-2.5 text-neon-cyan opacity-50" size={14} />
        </div>
      </div>

      <SectionHeader title="Recruitment Pipeline" />

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 overflow-x-auto pb-4">
        {COLUMNS.map((column) => {
          const columnApps = getColumnApplications(column.id);
          const isApplied = column.id === 'Applied';
          const isInterview = column.id === 'Interview';
          const showControls = isApplied ? showAppliedControls : isInterview ? showInterviewControls : false;
          const currentSort = isApplied ? appliedSort : interviewSort;
          const currentMinAI = isApplied ? appliedMinAI : interviewMinAI;
          const hasActiveFilter = currentMinAI > 0 || (isInterview && interviewMinSupervisor > 1) || currentSort !== 'none';
          
          return (
          <div key={column.id} className="min-w-[280px] flex flex-col h-[600px]">
            {/* Column Header */}
            <div className={`p-4 mb-2 rounded-lg border-b-2 bg-white/5 backdrop-blur-sm ${column.color}`}>
              <div className="flex justify-between items-center">
                <h3 className="font-orbitron font-bold text-sm tracking-wider text-white">{column.title}</h3>
                <div className="flex items-center gap-2">
                  {(isApplied || isInterview) && (
                    <button
                      onClick={() => isApplied ? setShowAppliedControls(!showAppliedControls) : setShowInterviewControls(!showInterviewControls)}
                      className={`p-1 rounded transition-colors ${hasActiveFilter ? 'text-neon-cyan bg-neon-cyan/20' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                    >
                      <SlidersHorizontal size={14} />
                    </button>
                  )}
                  <span className="text-xs font-mono text-gray-400 bg-black/40 px-2 py-1 rounded">
                    {columnApps.length}
                  </span>
                </div>
              </div>
              
              {/* Sort/Filter Controls */}
              {(isApplied || isInterview) && showControls && (
                <div className="mt-3 pt-3 border-t border-white/10 space-y-4">
                  {/* Sort Pills */}
                  <div>
                    <div className="flex items-center gap-1 mb-1.5">
                      <ArrowUpDown size={10} className="text-gray-500" />
                      <span className="text-[9px] text-gray-500 uppercase tracking-wider">Sırala</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { value: 'ai-desc', label: 'AI ↓' },
                        { value: 'ai-asc', label: 'AI ↑' },
                        ...(isInterview ? [
                          { value: 'supervisor-desc', label: '★ ↓' },
                          { value: 'supervisor-asc', label: '★ ↑' }
                        ] : [])
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            const newVal = currentSort === opt.value ? 'none' : opt.value as SortOption;
                            isApplied ? setAppliedSort(newVal) : setInterviewSort(newVal);
                          }}
                          className={`px-2 py-0.5 text-[10px] font-mono rounded-full border transition-all ${
                            currentSort === opt.value
                              ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan'
                              : 'bg-black/30 border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* AI Score Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] text-gray-500 uppercase tracking-wider">Min AI Score</span>
                      <span className="text-[10px] font-mono text-neon-cyan">{currentMinAI}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={currentMinAI}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        isApplied ? setAppliedMinAI(val) : setInterviewMinAI(val);
                      }}
                      className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
                      style={{
                        background: `linear-gradient(to right, #00f0ff ${currentMinAI}%, #374151 ${currentMinAI}%)`
                      }}
                    />
                    <div className="flex justify-between text-[8px] text-gray-600 mt-1">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  
                  {/* Supervisor Rating Slider (Interview only) */}
                  {isInterview && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] text-gray-500 uppercase tracking-wider">Min Supervisor</span>
                        <span className="text-[10px] font-mono text-yellow-500">{'★'.repeat(interviewMinSupervisor)}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={interviewMinSupervisor}
                        onChange={(e) => setInterviewMinSupervisor(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                        style={{
                          background: `linear-gradient(to right, #eab308 ${(interviewMinSupervisor - 1) * 25}%, #374151 ${(interviewMinSupervisor - 1) * 25}%)`
                        }}
                      />
                      <div className="flex justify-between text-[8px] text-gray-600 mt-1">
                        <span>1★</span>
                        <span>3★</span>
                        <span>5★</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Clear All */}
                  {hasActiveFilter && (
                    <button
                      onClick={() => {
                        if (isApplied) {
                          setAppliedSort('none');
                          setAppliedMinAI(0);
                        } else {
                          setInterviewSort('none');
                          setInterviewMinAI(0);
                          setInterviewMinSupervisor(1);
                        }
                      }}
                      className="flex items-center gap-1 text-[10px] text-neon-red/70 hover:text-neon-red"
                    >
                      <X size={10} /> Temizle
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Column Content */}
            <div className="flex-1 bg-white/5 rounded-xl p-2 space-y-3 overflow-y-auto custom-scrollbar border border-white/5">
              <AnimatePresence>
                {columnApps.map((app) => {
                  // Render phase-specific card
                  switch (column.id) {
                    case 'Applied':
                      return (
                        <AppliedCard
                          key={app.id}
                          app={app}
                          onDelete={handleDeleteApplication}
                          onViewDetails={setSelectedApplication}
                          onAdvance={handleAppliedAdvance}
                        />
                      );
                    case 'Interview':
                      return (
                        <InterviewCard
                          key={app.id}
                          app={app}
                          onDelete={handleDeleteApplication}
                          onViewDetails={setSelectedApplication}
                          onAdvance={handleInterviewAdvance}
                        />
                      );
                    case 'Offered':
                      return (
                        <OfferedCard
                          key={app.id}
                          app={app}
                          onDelete={handleDeleteApplication}
                          onViewDetails={setSelectedApplication}
                          onAdvance={handleOfferedAdvance}
                        />
                      );
                    case 'Hired':
                      return (
                        <HiredCard
                          key={app.id}
                          app={app}
                          onDelete={handleDeleteApplication}
                          onViewDetails={setSelectedApplication}
                          onConfirmHire={handleHiredConfirm}
                          departments={departments}
                        />
                      );
                    default:
                      return null;
                  }
                })}
              </AnimatePresence>

              {columnApps.length === 0 && (
                <div className="text-center py-8 opacity-20 text-sm font-rajdhani border-2 border-dashed border-gray-700 rounded-lg">
                  NO DATA PACKETS
                </div>
              )}
            </div>
          </div>
        );
        })}
      </div>
    </div>
  );
};
