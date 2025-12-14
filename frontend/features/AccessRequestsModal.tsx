import React, { useEffect, useState } from 'react';
import { Modal } from '../components/Modal';
import { NeonButton } from '../components/ui';
import { IAccessRequest } from '../types';
import { approveAccessRequest, denyAccessRequest, getAccessInbox, getAccessOutbox } from '../services/api';

interface AccessRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: (pendingInboxCount: number) => void;
}

export const AccessRequestsModal: React.FC<AccessRequestsModalProps> = ({ isOpen, onClose, onUpdated }) => {
  const [tab, setTab] = useState<'inbox' | 'outbox'>('inbox');
  const [inbox, setInbox] = useState<IAccessRequest[]>([]);
  const [outbox, setOutbox] = useState<IAccessRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [inboxData, outboxData] = await Promise.all([getAccessInbox(), getAccessOutbox()]);
      setInbox(inboxData);
      setOutbox(outboxData);
      onUpdated?.(inboxData.filter(r => r.status === 'Pending').length);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Access Requests" size="lg">
      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex rounded-lg border border-white/10 overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setTab('inbox')}
            className={`px-3 py-1 transition-colors ${tab === 'inbox' ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            Inbox
          </button>
          <button
            type="button"
            onClick={() => setTab('outbox')}
            className={`px-3 py-1 transition-colors border-l border-white/10 ${tab === 'outbox' ? 'bg-neon-purple/20 text-neon-purple' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            Outbox
          </button>
        </div>

        <NeonButton onClick={load} variant="ghost">
          Refresh
        </NeonButton>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
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
