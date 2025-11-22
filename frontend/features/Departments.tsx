import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Building2, Plus, Edit2, Trash2, Briefcase, DollarSign } from 'lucide-react';
import { GlassCard, NeonButton, SectionHeader } from '../components/ui';
import { IDepartment } from '../types';
import { getDepartments, deleteDepartment } from '../services/api';
import { DepartmentForm } from './DepartmentForm';

interface DepartmentsProps {
  onBack: () => void;
}

export const Departments: React.FC<DepartmentsProps> = ({ onBack }) => {
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDept, setEditingDept] = useState<IDepartment | null>(null);
  const [expandedDept, setExpandedDept] = useState<string | null>(null);

  const loadDepartments = () => {
    setLoading(true);
    getDepartments().then((data) => {
      setDepartments(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDepartment(id);
      loadDepartments();
    } catch (error: any) {
      alert(error.message || 'Failed to delete department');
    }
  };

  const handleEdit = (dept: IDepartment) => {
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

      <div className="flex items-center justify-between mb-8">
        <NeonButton onClick={onBack} variant="ghost" icon={ArrowLeft}>
          Back
        </NeonButton>
        <NeonButton onClick={() => setShowAddForm(true)} icon={Plus}>
          Add Department
        </NeonButton>
      </div>

      <SectionHeader title="Department Management" subtitle="Organize your workforce structure" />

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
          {departments.map((dept) => (
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
                    onClick={() => setExpandedDept(expandedDept === dept.id ? null : dept.id)}
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
                  onClick={() => setExpandedDept(expandedDept === dept.id ? null : dept.id)}
                >
                  <p className="text-sm text-gray-400 italic line-clamp-2">
                    {dept.description || 'No description provided'}
                  </p>
                </div>

                {/* Stats */}
                <div 
                  className="grid grid-cols-2 gap-3 mb-4"
                  onClick={() => setExpandedDept(expandedDept === dept.id ? null : dept.id)}
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

                {/* Job Positions - Expandable */}
                <AnimatePresence>
                  {expandedDept === dept.id && dept.jobs.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-white/10 pt-4 space-y-2">
                        <h4 className="text-xs font-rajdhani font-bold text-neon-cyan uppercase tracking-wider mb-3">
                          Job Positions
                        </h4>
                        {dept.jobs.map((job, index) => (
                          <div 
                            key={index}
                            className="bg-black/20 border border-white/5 rounded-lg p-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-white">{job.title}</span>
                              <span className="text-xs text-gray-500 font-mono">
                                ${(job.minSalary / 1000).toFixed(0)}k - ${(job.maxSalary / 1000).toFixed(0)}k
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Expand Indicator */}
                {dept.jobs.length > 0 && (
                  <button
                    onClick={() => setExpandedDept(expandedDept === dept.id ? null : dept.id)}
                    className="mt-3 w-full text-xs text-neon-cyan hover:text-neon-purple transition-colors text-center py-2 border-t border-white/5"
                  >
                    {expandedDept === dept.id ? '▲ Hide Positions' : '▼ Show Positions'}
                  </button>
                )}
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
