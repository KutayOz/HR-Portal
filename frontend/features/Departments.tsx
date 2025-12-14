import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Building2, Plus, Edit2, Trash2, Briefcase, DollarSign, Search } from 'lucide-react';
import { GlassCard, NeonButton, SectionHeader } from '../components/ui';
import { IDepartment } from '../types';
import { getDepartments, deleteDepartment, createAccessRequest, getAccessOutbox } from '../services/api';
import { DepartmentForm } from './DepartmentForm';
import { DepartmentDetailModal } from './DepartmentDetailModal';

interface DepartmentsProps {
  onBack: () => void;
}

export const Departments: React.FC<DepartmentsProps> = ({ onBack }) => {
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDept, setEditingDept] = useState<IDepartment | null>(null);
  const [selectedDept, setSelectedDept] = useState<IDepartment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [scope, setScope] = useState<'all' | 'yours'>('all');

  const getAdminId = (): string | null => {
    try {
      return localStorage.getItem('adminId');
    } catch {
      return null;
    }
  };

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dept.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const loadDepartments = () => {
    setLoading(true);
    getDepartments(scope).then((data) => {
      setDepartments(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadDepartments();
  }, [scope]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      return;
    }

    const adminId = getAdminId();
    const dept = departments.find(d => d.id === id);

    const hasActiveApproval = async () => {
      if (!adminId) return false;
      const outbox = await getAccessOutbox();
      const now = Date.now();
      return outbox.some(r =>
        r.resourceType === 'Department' &&
        r.resourceId === id &&
        r.status === 'Approved' &&
        r.allowedUntil &&
        new Date(r.allowedUntil).getTime() > now);
    };

    if (scope === 'all' && dept?.ownerAdminId && adminId && dept.ownerAdminId === adminId) {
      alert('Switch to "Yours" to edit/delete your own departments.');
      return;
    }

    if (dept?.ownerAdminId && adminId && dept.ownerAdminId !== adminId) {
      if (await hasActiveApproval()) {
        // allowed
      } else {
      try {
        await createAccessRequest('Department', id, `${adminId} wants access to your Department`);
        alert('Access request sent to the responsible admin.');
      } catch (e: any) {
        alert(e?.message || 'Failed to send access request');
      }
      return;
      }
    }

    try {
      await deleteDepartment(id);
      loadDepartments();
    } catch (error: any) {
      alert(error.message || 'Failed to delete department');
    }
  };

  const handleEdit = (dept: IDepartment) => {
    const adminId = getAdminId();

    const hasActiveApproval = async () => {
      if (!adminId) return false;
      const outbox = await getAccessOutbox();
      const now = Date.now();
      return outbox.some(r =>
        r.resourceType === 'Department' &&
        r.resourceId === dept.id &&
        r.status === 'Approved' &&
        r.allowedUntil &&
        new Date(r.allowedUntil).getTime() > now);
    };

    if (scope === 'all' && dept.ownerAdminId && adminId && dept.ownerAdminId === adminId) {
      alert('Switch to "Yours" to edit your own departments.');
      return;
    }

    if (dept.ownerAdminId && adminId && dept.ownerAdminId !== adminId) {
      hasActiveApproval()
        .then((allowed) => {
          if (allowed) {
            setEditingDept(dept);
            setShowAddForm(true);
            return;
          }

          return createAccessRequest('Department', dept.id, `${adminId} wants access to your Department`)
            .then(() => alert('Access request sent to the responsible admin.'))
            .catch((e: any) => alert(e?.message || 'Failed to send access request'));
        });
      return;
    }
    setEditingDept(dept);
    setShowAddForm(true);
  };

  return (
    <div className="relative min-h-[80vh]">
      <DepartmentForm 
        isOpen={showAddForm} 
        onClose={() => {
          setShowAddForm(false);
          setEditingDept(null);
        }} 
        onSuccess={loadDepartments}
        editDepartment={editingDept}
      />

      <DepartmentDetailModal
        isOpen={selectedDept !== null}
        onClose={() => setSelectedDept(null)}
        department={selectedDept}
      />

      <div className="flex items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <NeonButton onClick={onBack} variant="ghost" icon={ArrowLeft}>
            Back
          </NeonButton>
          <NeonButton
            onClick={() => {
              if (scope === 'all') {
                alert('Switch to "Yours" to create departments.');
                return;
              }
              setEditingDept(null);
              setShowAddForm(true);
            }}
            icon={Plus}
          >
            Add Department
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
            placeholder="SEARCH_DEPT_"
          />
          <Search className="absolute right-3 top-2.5 text-neon-cyan opacity-50" size={14} />
        </div>
      </div>

      <SectionHeader title="Department Management"/>

      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block w-12 h-12 border-4 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin"></div>
          <p className="text-gray-400 mt-4">Loading departments...</p>
        </div>
      ) : departments.length === 0 ? (
        <GlassCard className="p-16 text-center">
          <Building2 className="w-20 h-20 mx-auto mb-4 text-gray-600" />
          <h3 className="text-xl font-orbitron font-bold mb-2">No Departments Yet</h3>
          <p className="text-gray-400 mb-2">You don't have any departments yet.</p>
          <p className="text-gray-500 text-sm">Use the <span className="text-neon-cyan font-rajdhani">"Add Department"</span> button above to create your first one.</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepartments.map((dept) => (
            <motion.div
              key={dept.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="group"
            >
              <GlassCard className="p-6 hover:border-neon-cyan/50 transition-all duration-300 cursor-pointer h-full flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div 
                    className="flex-1"
                    onClick={() => setSelectedDept(dept)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/30 flex items-center justify-center">
                        <Building2 className="text-neon-cyan" size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-orbitron font-bold text-white">{dept.name}</h3>
                        <p className="text-xs text-gray-500 font-rajdhani">{dept.id}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(dept)}
                      className="p-2 bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan/30 rounded-lg transition-colors"
                      title="Edit Department"
                    >
                      <Edit2 size={16} className="text-neon-cyan" />
                    </button>
                    <button
                      onClick={() => handleDelete(dept.id)}
                      className="p-2 bg-neon-red/10 hover:bg-neon-red/20 border border-neon-red/30 rounded-lg transition-colors"
                      title="Delete Department"
                    >
                      <Trash2 size={16} className="text-neon-red" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div 
                  className="mb-4 flex-1"
                  onClick={() => setSelectedDept(dept)}
                >
                  <p className="text-sm text-gray-400 italic line-clamp-2">
                    {dept.description || 'No description provided'}
                  </p>
                </div>

                {/* Stats */}
                <div 
                  className="grid grid-cols-2 gap-3 mb-4"
                  onClick={() => setSelectedDept(dept)}
                >
                  <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                      <Briefcase size={14} className="text-neon-purple" />
                      <span className="text-xs text-gray-500 font-rajdhani uppercase">Positions</span>
                    </div>
                    <p className="text-2xl font-orbitron font-bold text-white">{dept.jobs.length}</p>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign size={14} className="text-neon-green" />
                      <span className="text-xs text-gray-500 font-rajdhani uppercase">Avg Salary</span>
                    </div>
                    <p className="text-lg font-orbitron font-bold text-white">
                      {dept.jobs.length > 0 
                        ? `$${Math.round(dept.jobs.reduce((sum, j) => sum + (j.minSalary + j.maxSalary) / 2, 0) / dept.jobs.length / 1000)}k`
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
