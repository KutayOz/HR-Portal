import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, ChevronRight, Eye, Star, FileText, Check } from 'lucide-react';
import { IJobApplication, IDepartment } from '../types';

interface BaseCardProps {
  app: IJobApplication;
  onDelete: (id: string, skipConfirm?: boolean) => void;
  onViewDetails: (app: IJobApplication) => void;
}

interface AppliedCardProps extends BaseCardProps {
  onAdvance: (id: string) => void;
}

interface InterviewCardProps extends BaseCardProps {
  onAdvance: (id: string, supervisorRating: number, supervisorNotes: string) => void;
}

interface OfferedCardProps extends BaseCardProps {
  onAdvance: (id: string, contractData: ContractData) => void;
}

interface HiredCardProps extends BaseCardProps {
  onConfirmHire: (id: string, employeeData: EmployeeData) => void;
  departments: IDepartment[];
}

export interface ContractData {
  contractType: string;
  salary: number;
  startDate: string;
  currency: string;
}

export interface EmployeeData {
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  hireDate: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  currentSalary: number;
}

// Generate random AI score for candidates
export const getAIScore = (candidateId: string): number => {
  // Use candidateId as seed for consistent random score
  const seed = candidateId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return 60 + (seed % 36); // 60-95 range
};

// Generate random supervisor rating (1-5 stars)
export const getSupervisorRating = (candidateId: string): number => {
  const seed = candidateId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return 2 + (seed % 4); // 2-5 range (realistic ratings)
};

// Applied Card - Simple with AI Match Score
export const AppliedCard: React.FC<AppliedCardProps> = ({ app, onDelete, onViewDetails, onAdvance }) => {
  const aiScore = app.matchScore || getAIScore(app.candidateId);

  return (
    <motion.div
      layoutId={app.id}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="bg-[#0a0a15] border border-white/10 p-4 rounded-lg shadow-lg hover:border-neon-cyan/40 transition-colors"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3 cursor-pointer" onClick={() => onViewDetails(app)}>
        <img src={app.candidate.avatarUrl} alt="av" className="w-10 h-10 rounded-full border border-gray-600" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-white truncate">{app.candidate.firstName} {app.candidate.lastName}</div>
          <div className="text-[10px] text-neon-cyan font-mono uppercase truncate">{app.position}</div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onViewDetails(app); }} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white">
          <Eye size={14} />
        </button>
      </div>

      {/* AI Match Score */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
          <span>AI MATCH</span>
          <span className="text-neon-cyan">{aiScore}%</span>
        </div>
        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${aiScore > 85 ? 'bg-neon-green' : aiScore > 70 ? 'bg-neon-cyan' : 'bg-yellow-500'}`}
            style={{ width: `${aiScore}%` }}
          />
        </div>
      </div>

      {/* Skills */}
      <div className="flex flex-wrap gap-1 mb-3">
        {app.candidate.skills.slice(0, 3).map(skill => (
          <span key={skill} className="text-[9px] px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-gray-400">{skill}</span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center border-t border-white/5 pt-2">
        <button onClick={() => onDelete(app.id)} className="p-1.5 hover:bg-neon-red/20 rounded text-neon-red/60 hover:text-neon-red">
          <Trash2 size={14} />
        </button>
        <button
          onClick={() => onAdvance(app.id)}
          className="flex items-center gap-1 px-3 py-1 bg-neon-green/10 hover:bg-neon-green/20 rounded text-neon-green text-xs font-mono border border-neon-green/30"
        >
          İlerlet <ChevronRight size={14} />
        </button>
      </div>
    </motion.div>
  );
};

// Interview Card - AI Score + Supervisor Rating (auto-generated)
export const InterviewCard: React.FC<InterviewCardProps> = ({ app, onDelete, onViewDetails, onAdvance }) => {
  const aiScore = app.matchScore || getAIScore(app.candidateId);
  const supervisorRating = getSupervisorRating(app.candidateId);

  const handleAdvance = () => {
    onAdvance(app.id, supervisorRating, `Supervisor değerlendirmesi: ${supervisorRating}/5`);
  };

  return (
    <motion.div
      layoutId={app.id}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="bg-[#0a0a15] border border-neon-cyan/30 p-4 rounded-lg shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3 cursor-pointer" onClick={() => onViewDetails(app)}>
        <img src={app.candidate.avatarUrl} alt="av" className="w-10 h-10 rounded-full border border-neon-cyan/50" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-white truncate">{app.candidate.firstName} {app.candidate.lastName}</div>
          <div className="text-[10px] text-neon-cyan font-mono uppercase truncate">{app.position}</div>
        </div>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-black/30 rounded p-2">
          <div className="text-[9px] text-gray-500 mb-1">AI SCORE</div>
          <div className="text-lg font-bold text-neon-cyan">{aiScore}%</div>
        </div>
        <div className="bg-black/30 rounded p-2">
          <div className="text-[9px] text-gray-500 mb-1">SUPERVISOR</div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                size={14}
                className={`transition-colors ${star <= supervisorRating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-600'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center border-t border-white/5 pt-2">
        <button onClick={() => onDelete(app.id)} className="p-1.5 hover:bg-neon-red/20 rounded text-neon-red/60 hover:text-neon-red">
          <Trash2 size={14} />
        </button>
        <button
          onClick={handleAdvance}
          className="flex items-center gap-1 px-3 py-1 bg-neon-green/10 hover:bg-neon-green/20 rounded text-neon-green text-xs font-mono border border-neon-green/30"
        >
          İlerlet <ChevronRight size={14} />
        </button>
      </div>
    </motion.div>
  );
};

// Offered Card - Contract Details Form
export const OfferedCard: React.FC<OfferedCardProps> = ({ app, onDelete, onViewDetails, onAdvance }) => {
  const [showContract, setShowContract] = useState(false);
  const [contractData, setContractData] = useState<ContractData>({
    contractType: 'FullTime',
    salary: app.expectedSalary || 0,
    startDate: new Date().toISOString().split('T')[0],
    currency: 'TRY'
  });

  const handleAdvance = () => {
    if (!showContract) {
      setShowContract(true);
      return;
    }
    if (contractData.salary <= 0) {
      alert('Lütfen maaş bilgisini girin');
      return;
    }
    onAdvance(app.id, contractData);
  };

  return (
    <motion.div
      layoutId={app.id}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="bg-[#0a0a15] border border-neon-purple/30 p-4 rounded-lg shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3 cursor-pointer" onClick={() => onViewDetails(app)}>
        <img src={app.candidate.avatarUrl} alt="av" className="w-10 h-10 rounded-full border border-neon-purple/50" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-white truncate">{app.candidate.firstName} {app.candidate.lastName}</div>
          <div className="text-[10px] text-neon-purple font-mono uppercase truncate">{app.position}</div>
        </div>
        <FileText size={16} className="text-neon-purple" />
      </div>

      {/* Contract Form */}
      {showContract ? (
        <div className="space-y-2 mb-3">
          <div>
            <label className="text-[9px] text-gray-500">SÖZLEŞME TİPİ</label>
            <select
              value={contractData.contractType}
              onChange={(e) => setContractData({ ...contractData, contractType: e.target.value })}
              className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white focus:border-neon-purple focus:outline-none"
            >
              <option value="FullTime">Tam Zamanlı</option>
              <option value="PartTime">Yarı Zamanlı</option>
              <option value="Contract">Sözleşmeli</option>
              <option value="Intern">Stajyer</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] text-gray-500">MAAŞ</label>
              <input
                type="number"
                value={contractData.salary}
                onChange={(e) => setContractData({ ...contractData, salary: parseFloat(e.target.value) || 0 })}
                className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white focus:border-neon-purple focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[9px] text-gray-500">PARA BİRİMİ</label>
              <select
                value={contractData.currency}
                onChange={(e) => setContractData({ ...contractData, currency: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white focus:border-neon-purple focus:outline-none"
              >
                <option value="TRY">TRY</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[9px] text-gray-500">BAŞLANGIÇ TARİHİ</label>
            <input
              type="date"
              value={contractData.startDate}
              onChange={(e) => setContractData({ ...contractData, startDate: e.target.value })}
              className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white focus:border-neon-purple focus:outline-none"
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500 text-xs">
          Teklif aşamasında sözleşme bilgilerini girin
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center border-t border-white/5 pt-2">
        <button onClick={() => onDelete(app.id)} className="p-1.5 hover:bg-neon-red/20 rounded text-neon-red/60 hover:text-neon-red">
          <Trash2 size={14} />
        </button>
        <button
          onClick={handleAdvance}
          className="flex items-center gap-1 px-3 py-1 bg-neon-purple/10 hover:bg-neon-purple/20 rounded text-neon-purple text-xs font-mono border border-neon-purple/30"
        >
          {showContract ? 'Teklifi Onayla' : 'Sözleşme Gir'} <ChevronRight size={14} />
        </button>
      </div>
    </motion.div>
  );
};

// Hired Card - Complete Employee Form + Confirm
export const HiredCard: React.FC<HiredCardProps> = ({ app, onDelete, onViewDetails, onConfirmHire, departments }) => {
  const [showForm, setShowForm] = useState(false);
  const candidatePhone = app.candidate.phoneNumber ?? '';
  // Use offeredSalary from Offer stage, fallback to expectedSalary
  const initialSalary = app.offeredSalary ?? app.expectedSalary ?? 0;
  const [employeeData, setEmployeeData] = useState<EmployeeData>({
    email: `${app.candidate.firstName.toLowerCase()}.${app.candidate.lastName.toLowerCase()}@company.com`,
    phoneNumber: candidatePhone,
    dateOfBirth: '',
    hireDate: new Date().toISOString().split('T')[0],
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Türkiye',
    currentSalary: initialSalary
  });

  useEffect(() => {
    if (!candidatePhone) return;
    setEmployeeData(prev => (prev.phoneNumber ? prev : { ...prev, phoneNumber: candidatePhone }));
  }, [candidatePhone]);

  const handleConfirm = () => {
    if (!showForm) {
      setShowForm(true);
      return;
    }
    // Validate required fields
    if (!employeeData.email || !employeeData.dateOfBirth || !employeeData.phoneNumber?.trim()) {
      alert('Lütfen zorunlu alanları doldurun (Email, Doğum Tarihi, Telefon)');
      return;
    }
    onConfirmHire(app.id, employeeData);
  };

  return (
    <motion.div
      layoutId={app.id}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="bg-[#0a0a15] border border-neon-green/30 p-4 rounded-lg shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3 cursor-pointer" onClick={() => onViewDetails(app)}>
        <img src={app.candidate.avatarUrl} alt="av" className="w-10 h-10 rounded-full border-2 border-neon-green/50" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-white truncate">{app.candidate.firstName} {app.candidate.lastName}</div>
          <div className="text-[10px] text-neon-green font-mono uppercase truncate">{app.position}</div>
        </div>
        <Check size={16} className="text-neon-green" />
      </div>

      {/* Employee Form */}
      {showForm ? (
        <div className="space-y-2 mb-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
          <div className="text-[10px] text-neon-green font-mono mb-2">PERSONEL BİLGİLERİ</div>
          
          <div>
            <label className="text-[9px] text-gray-500">EMAIL *</label>
            <input
              type="email"
              value={employeeData.email}
              onChange={(e) => setEmployeeData({ ...employeeData, email: e.target.value })}
              className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white focus:border-neon-green focus:outline-none"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] text-gray-500">TELEFON *</label>
              {candidatePhone ? (
                <div className="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-white">
                  {candidatePhone}
                </div>
              ) : (
                <input
                  type="tel"
                  value={employeeData.phoneNumber}
                  onChange={(e) => setEmployeeData({ ...employeeData, phoneNumber: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white focus:border-neon-green focus:outline-none"
                />
              )}
            </div>
            <div>
              <label className="text-[9px] text-gray-500">DOĞUM TARİHİ *</label>
              <input
                type="date"
                value={employeeData.dateOfBirth}
                onChange={(e) => setEmployeeData({ ...employeeData, dateOfBirth: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white focus:border-neon-green focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] text-gray-500">İŞE BAŞLAMA</label>
              <input
                type="date"
                value={employeeData.hireDate}
                onChange={(e) => setEmployeeData({ ...employeeData, hireDate: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white focus:border-neon-green focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[9px] text-gray-500">MAAŞ {app.offeredSalary ? '(Tekliften)' : ''}</label>
              {app.offeredSalary ? (
                <div className="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-white">
                  {app.offeredSalary.toLocaleString('tr-TR')} ₺
                </div>
              ) : (
                <input
                  type="number"
                  value={employeeData.currentSalary}
                  onChange={(e) => setEmployeeData({ ...employeeData, currentSalary: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white focus:border-neon-green focus:outline-none"
                />
              )}
            </div>
          </div>

          <div className="text-[10px] text-gray-600 font-mono mt-2 mb-1">ADRES BİLGİLERİ</div>
          
          <div>
            <label className="text-[9px] text-gray-500">ADRES</label>
            <input
              type="text"
              value={employeeData.address}
              onChange={(e) => setEmployeeData({ ...employeeData, address: e.target.value })}
              className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white focus:border-neon-green focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] text-gray-500">ŞEHİR</label>
              <input
                type="text"
                value={employeeData.city}
                onChange={(e) => setEmployeeData({ ...employeeData, city: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white focus:border-neon-green focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[9px] text-gray-500">İLÇE/BÖLGE</label>
              <input
                type="text"
                value={employeeData.state}
                onChange={(e) => setEmployeeData({ ...employeeData, state: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white focus:border-neon-green focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] text-gray-500">POSTA KODU</label>
              <input
                type="text"
                value={employeeData.postalCode}
                onChange={(e) => setEmployeeData({ ...employeeData, postalCode: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white focus:border-neon-green focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[9px] text-gray-500">ÜLKE</label>
              <input
                type="text"
                value={employeeData.country}
                onChange={(e) => setEmployeeData({ ...employeeData, country: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white focus:border-neon-green focus:outline-none"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="text-neon-green text-xs font-mono mb-1">✓ İŞE ALINDI</div>
          <div className="text-gray-500 text-[10px]">Personel bilgilerini tamamlayın</div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center border-t border-white/5 pt-2">
        <button onClick={() => onDelete(app.id)} className="p-1.5 hover:bg-neon-red/20 rounded text-neon-red/60 hover:text-neon-red">
          <Trash2 size={14} />
        </button>
        <button
          onClick={handleConfirm}
          className="flex items-center gap-1 px-3 py-1 bg-neon-green/20 hover:bg-neon-green/30 rounded text-neon-green text-xs font-mono border border-neon-green/50 font-bold"
        >
          {showForm ? 'Personeli Onayla' : 'Bilgileri Gir'} <Check size={14} />
        </button>
      </div>
    </motion.div>
  );
};
