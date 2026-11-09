'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  ShieldAlert,
  Search,
  KeyRound,
  AlertTriangle,
  Clock,
  UserCheck,
  CheckCircle2,
  X,
  FileText,
  Lock,
} from 'lucide-react';

interface FlaggedMessage {
  _id: string;
  mentorshipId: string;
  sender: {
    _id: string;
    name: string;
    role: string;
    email: string;
  };
  redactedContent: string;
  detectedTypes: string[];
  isMutualContactUnlocked: boolean;
  createdAt: string;
}

export default function ModerationQueuePage() {
  const [messages, setMessages] = useState<FlaggedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Decryption Modal State
  const [selectedMsg, setSelectedMsg] = useState<FlaggedMessage | null>(null);
  const [justification, setJustification] = useState('');
  const [decrypting, setDecrypting] = useState(false);
  const [decryptedResult, setDecryptedResult] = useState<{
    decryptedContent: string;
    auditedBy: string;
    auditedAt: string;
  } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchModerationQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/analytics/moderation-queue');
      setMessages(res.data?.data?.flaggedMessages || []);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to load moderation queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModerationQueue();
  }, []);

  const handleOpenDecryptModal = (msg: FlaggedMessage) => {
    setSelectedMsg(msg);
    setJustification('');
    setDecryptedResult(null);
    setModalError(null);
  };

  const handleCloseModal = () => {
    setSelectedMsg(null);
    setJustification('');
    setDecryptedResult(null);
    setModalError(null);
  };

  const handleExecuteDecryption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMsg) return;
    if (!justification.trim() || justification.trim().length < 10) {
      setModalError('A clear justification reason (minimum 10 characters) is legally required for cryptographic audit.');
      return;
    }

    try {
      setDecrypting(true);
      setModalError(null);
      const res = await api.post(
        `/messaging/${selectedMsg.mentorshipId}/messages/${selectedMsg._id}/moderation-decrypt`,
        { reason: justification.trim() }
      );
      setDecryptedResult(res.data?.data);
    } catch (err: any) {
      setModalError(err?.response?.data?.error?.message || 'Failed to decrypt message.');
    } finally {
      setDecrypting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
              Privacy Shield Moderation Queue
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
              {messages.length} Flagged
            </span>
          </div>
          <p className="text-sm text-neutral-500 mt-1">
            Review intercepted contact leaks, off-platform solicitation attempts, and perform audited cryptographic decryption.
          </p>
        </div>

        <button
          onClick={fetchModerationQueue}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition shadow-xs"
        >
          <Clock className="w-3.5 h-3.5" />
          Refresh Queue
        </button>
      </div>

      {/* Safety Notice */}
      <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/60 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong className="font-semibold text-amber-950">Zero-Trust Privacy Protocol:</strong> Messages containing detected contact details are automatically masked in the chat workspace. Decryption of raw payloads requires an authorized officer role and generates an immutable, tamper-evident audit log with your recorded legal justification.
        </div>
      </div>

      {/* Messages List */}
      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-neutral-200/70">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900" />
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center text-red-700 text-sm">
          {error}
        </div>
      ) : messages.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-neutral-200/70 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-medium text-neutral-900 text-sm">No Pending Moderation Incidents</h3>
          <p className="text-xs text-neutral-500 mt-1">
            Privacy Shield filters are actively intercepting PII without unaddressed flags.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200/70 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/80 border-b border-neutral-200/70 text-neutral-500 font-medium">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Sender</th>
                  <th className="py-3 px-4">Detected PII Types</th>
                  <th className="py-3 px-4">Redacted Payload Preview</th>
                  <th className="py-3 px-4 text-right">Moderation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {messages.map((msg) => (
                  <tr key={msg._id} className="hover:bg-neutral-50/60 transition">
                    <td className="py-3 px-4 text-neutral-500 whitespace-nowrap">
                      {new Date(msg.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-neutral-900">{msg.sender.name}</div>
                      <div className="text-[11px] text-neutral-400 font-mono">
                        {msg.sender.role} &bull; {msg.sender.email}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {msg.detectedTypes.map((type) => (
                          <span
                            key={type}
                            className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-700 border border-red-200/60"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-neutral-600 font-mono text-[11px]">
                      {msg.redactedContent}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenDecryptModal(msg)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-neutral-900 text-white hover:bg-neutral-800 transition shadow-xs"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        Inspect & Decrypt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Moderation Decryption Modal */}
      {selectedMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-neutral-200/80 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-red-50 text-red-600">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-neutral-900">
                    Audited Message Decryption
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Security ID: {selectedMsg._id.slice(-8)}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Redacted Content (Recipient View)
                </label>
                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-600 text-xs font-mono break-words">
                  {selectedMsg.redactedContent}
                </div>
              </div>

              {!decryptedResult ? (
                <form onSubmit={handleExecuteDecryption} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Legal & Operational Justification <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                      placeholder="Specify rationale (e.g. 'Investigating reported student harassment or commercial contract solicitation')..."
                      rows={3}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-hidden focus:ring-2 focus:ring-neutral-900 transition resize-none"
                    />
                    <p className="text-[10px] text-neutral-400 mt-1">
                      This explanation will be permanently recorded in the institutional audit log alongside your identity.
                    </p>
                  </div>

                  {modalError && (
                    <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                      {modalError}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={decrypting || justification.trim().length < 10}
                      className="px-4 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition shadow-xs flex items-center gap-1.5"
                    >
                      {decrypting ? 'Decrypting...' : 'Perform Audited Decrypt'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/70">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Cryptographic Decryption Successful (AES-256-GCM)
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-emerald-200 text-xs font-mono text-neutral-900 break-words">
                      {decryptedResult.decryptedContent}
                    </div>
                  </div>

                  <div className="text-[11px] text-neutral-500 space-y-1 bg-neutral-50 p-3 rounded-xl border border-neutral-200/60">
                    <div>
                      <strong>Audited Officer:</strong> {decryptedResult.auditedBy}
                    </div>
                    <div>
                      <strong>Audit Timestamp:</strong>{' '}
                      {new Date(decryptedResult.auditedAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleCloseModal}
                      className="px-4 py-1.5 rounded-lg text-xs font-medium bg-neutral-900 text-white hover:bg-neutral-800 transition"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
