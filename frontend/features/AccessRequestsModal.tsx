import React, { useEffect, useState } from 'react';
import { Modal } from '../components/Modal';
import { NeonButton } from '../components/ui';
import { IAccessRequest, IAdminDelegation } from '../types';
import { approveAccessRequest, denyAccessRequest, getAccessInbox, getAccessOutbox, getOutgoingDelegations, getIncomingDelegations, createDelegation, revokeDelegation } from '../services/api';
import { Clock, UserCheck, Send } from 'lucide-react';

interface AccessRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: (pendingInboxCount: number) => void;
}

export const AccessRequestsModal: React.FC<AccessRequestsModalProps> = ({ isOpen, onClose, onUpdated }) => {
  const [tab, setTab] = useState<'inbox' | 'outbox' | 'delegations'>('inbox');
  const [inbox, setInbox] = useState<IAccessRequest[]>([]);
  const [outbox, setOutbox] = useState<IAccessRequest[]>([]);
  const [outgoingDelegations, setOutgoingDelegations] = useState<IAdminDelegation[]>([]);
  const [incomingDelegations, setIncomingDelegations] = useState<IAdminDelegation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDelegationForm, setShowDelegationForm] = useState(false);
  const [delegationForm, setDelegationForm] = useState({
    toAdminId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    reason: ''
  });

  const load = async () => {
    setLoading(true);
    try {
      const [inboxData, outboxData, outDelegations, inDelegations] = await Promise.all([
        getAccessInbox(), 
        getAccessOutbox(),
        getOutgoingDelegations(),
        getIncomingDelegations()
      ]);
      setInbox(inboxData);
      setOutbox(outboxData);
      setOutgoingDelegations(outDelegations);
      setIncomingDelegations(inDelegations);
      onUpdated?.(inboxData.filter(r => r.status === 'Pending').length);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDelegation = async () => {
    if (!delegationForm.toAdminId || !delegationForm.endDate) {
      alert('Please fill in required fields');
      return;
    }
    try {
      await createDelegation(
        delegationForm.toAdminId,
        delegationForm.startDate,
        delegationForm.endDate,
        delegationForm.reason || undefined
      );
      setShowDelegationForm(false);
      setDelegationForm({ toAdminId: '', startDate: new Date().toISOString().split('T')[0], endDate: '', reason: '' });
      await load();
    } catch (e: any) {
      alert(e?.message || 'Failed to create delegation');
    }
  };

  const handleRevokeDelegation = async (id: number) => {
    if (!confirm('Revoke this delegation?')) return;
    try {
      await revokeDelegation(id);
      await load();
    } catch (e: any) {
      alert(e?.message || 'Failed to revoke delegation');
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();
  const isActive = (d: IAdminDelegation) => d.status === 'Active' && new Date(d.endDate) > new Date();

  useEffect(() => {
    if (!isOpen) return;
    load();
  }, [isOpen]);

  const handleApprove = async (id: string) => {
    const minutesRaw = prompt('Allow access for how many minutes?', '15');
    const minutes = minutesRaw ? parseInt(minutesRaw, 10) : 15;
    try {
      await approveAccessRequest(id, Number.isFinite(minutes) ? minutes : 15);
      await load();
    } catch (e: any) {
      alert(e?.message || 'Failed to approve request');
    }
  };

  const handleDeny = async (id: string) => {
    if (!confirm('Deny this access request?')) return;
    try {
      await denyAccessRequest(id);
      await load();
    } catch (e: any) {
      alert(e?.message || 'Failed to deny request');
    }
  };

  const items = tab === 'inbox' ? inbox : outbox;
  const activeDelegationsToMe = incomingDelegations.filter(isActive);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Access & Delegations" size="lg">
      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex rounded-lg border border-white/10 overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setTab('inbox')}
            className={`px-3 py-1 transition-colors ${tab === 'inbox' ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            Inbox {inbox.filter(r => r.status === 'Pending').length > 0 && <span className="ml-1 px-1 bg-neon-cyan/30 rounded text-[10px]">{inbox.filter(r => r.status === 'Pending').length}</span>}
          </button>
          <button
            type="button"
            onClick={() => setTab('outbox')}
            className={`px-3 py-1 transition-colors border-l border-white/10 ${tab === 'outbox' ? 'bg-neon-purple/20 text-neon-purple' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            Outbox
          </button>
          <button
            type="button"
            onClick={() => setTab('delegations')}
            className={`px-3 py-1 transition-colors border-l border-white/10 flex items-center gap-1 ${tab === 'delegations' ? 'bg-neon-green/20 text-neon-green' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <UserCheck size={12} /> Delegations
            {activeDelegationsToMe.length > 0 && <span className="ml-1 px-1 bg-neon-green/30 rounded text-[10px]">{activeDelegationsToMe.length}</span>}
          </button>
        </div>

        <NeonButton onClick={load} variant="ghost">
          Refresh
        </NeonButton>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
      ) : tab === 'delegations' ? (
        <div className="space-y-4">
          {/* Create Delegation Button */}
          <div className="flex justify-end">
            <NeonButton onClick={() => setShowDelegationForm(!showDelegationForm)} icon={Send}>
              {showDelegationForm ? 'Cancel' : 'New Delegation'}
            </NeonButton>
          </div>

          {/* Delegation Form */}
          {showDelegationForm && (
            <div className="bg-neon-green/5 border border-neon-green/20 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-orbitron text-neon-green">Delegate Authority</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">To Admin ID *</label>
                  <input
                    type="text"
                    value={delegationForm.toAdminId}
                    onChange={(e) => setDelegationForm({...delegationForm, toAdminId: e.target.value})}
                    placeholder="admin-2"
                    className="w-full bg-black/50 border border-white/10 rounded px-3 py-1.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">End Date *</label>
                  <input
                    type="datetime-local"
                    value={delegationForm.endDate}
                    onChange={(e) => setDelegationForm({...delegationForm, endDate: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded px-3 py-1.5 text-sm text-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-400 block mb-1">Reason</label>
                  <input
                    type="text"
                    value={delegationForm.reason}
                    onChange={(e) => setDelegationForm({...delegationForm, reason: e.target.value})}
                    placeholder="Vacation, sick leave, etc."
                    className="w-full bg-black/50 border border-white/10 rounded px-3 py-1.5 text-sm text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <NeonButton onClick={handleCreateDelegation}>Create Delegation</NeonButton>
              </div>
            </div>
          )}

          {/* Incoming Delegations (to me) */}
          {incomingDelegations.length > 0 && (
            <div>
              <h4 className="text-xs text-gray-500 uppercase mb-2 flex items-center gap-2">
                <Clock size={12} /> Delegated to Me
              </h4>
              <div className="space-y-2">
                {incomingDelegations.map((d) => (
                  <div key={d.id} className={`p-3 rounded-lg border ${isActive(d) ? 'bg-neon-green/5 border-neon-green/30' : 'bg-white/5 border-white/10 opacity-60'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white text-sm font-medium">From: {d.fromAdminId}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {formatDate(d.startDate)} → {formatDate(d.endDate)}
                          {d.reason && <span className="ml-2 text-gray-500">({d.reason})</span>}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${isActive(d) ? 'bg-neon-green/20 text-neon-green' : 'bg-gray-500/20 text-gray-400'}`}>
                        {isActive(d) ? 'ACTIVE' : d.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Outgoing Delegations (from me) */}
          {outgoingDelegations.length > 0 && (
            <div>
              <h4 className="text-xs text-gray-500 uppercase mb-2 flex items-center gap-2">
                <Send size={12} /> My Delegations
              </h4>
              <div className="space-y-2">
                {outgoingDelegations.map((d) => (
                  <div key={d.id} className={`p-3 rounded-lg border ${isActive(d) ? 'bg-neon-purple/5 border-neon-purple/30' : 'bg-white/5 border-white/10 opacity-60'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white text-sm font-medium">To: {d.toAdminId}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {formatDate(d.startDate)} → {formatDate(d.endDate)}
                          {d.reason && <span className="ml-2 text-gray-500">({d.reason})</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${isActive(d) ? 'bg-neon-purple/20 text-neon-purple' : 'bg-gray-500/20 text-gray-400'}`}>
                          {isActive(d) ? 'ACTIVE' : d.status}
                        </span>
                        {isActive(d) && (
                          <button
                            onClick={() => handleRevokeDelegation(d.id)}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {incomingDelegations.length === 0 && outgoingDelegations.length === 0 && !showDelegationForm && (
            <div className="text-center py-8 text-gray-500 text-sm">
              No delegations. Create one to delegate your responsibilities to another admin.
            </div>
          )}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm">No requests.</div>
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <div key={r.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-white font-orbitron text-sm truncate">
                    {r.resourceType} {r.resourceId}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Owner: <span className="text-gray-200">{r.ownerAdminId}</span> • Requester: <span className="text-gray-200">{r.requesterAdminId}</span>
                  </div>
                  {r.note && (
                    <div className="text-xs text-gray-500 mt-2">
                      {r.note}
                    </div>
                  )}
                  <div className="text-[10px] text-gray-500 font-mono mt-2">
                    Status: <span className="text-gray-200">{r.status}</span> • Requested: {new Date(r.requestedAt).toLocaleString()}
                    {r.allowedUntil && ` • Allowed until: ${new Date(r.allowedUntil).toLocaleString()}`}
                  </div>
                </div>

                {tab === 'inbox' && r.status === 'Pending' && (
                  <div className="flex gap-2">
                    <NeonButton onClick={() => handleApprove(r.id)}>
                      Approve
                    </NeonButton>
                    <NeonButton onClick={() => handleDeny(r.id)} variant="danger">
                      Deny
                    </NeonButton>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};
