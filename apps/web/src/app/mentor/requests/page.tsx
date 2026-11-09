'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
  X,
  AlertCircle,
  GraduationCap,
  Target,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { Breadcrumb } from '@/components/arc/breadcrumb/breadcrumb';
import { Button } from '@/components/arc/button/button';

export default function MentorRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [capacity, setCapacity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    const [reqRes, capRes] = await Promise.all([
      fetchApi<any[]>('/requests/received'),
      fetchApi<any>('/alumni/capacity/me'),
    ]);

    if (reqRes.success && reqRes.data) setRequests(reqRes.data);
    if (capRes.success && capRes.data) setCapacity(capRes.data);
    setLoading(false);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAccept = async (requestId: string) => {
    setErrorMessage(null);
    const res = await fetchApi<any>(`/requests/${requestId}/accept`, { method: 'POST' });

    if (res.success) {
      setToastMessage('Mentorship request accepted! Active workspace created.');
      loadRequests();
      setTimeout(() => setToastMessage(null), 4000);
    } else {
      setErrorMessage(res.error?.message || 'Failed to accept request. Capacity limit may be reached.');
    }
  };

  const handleDecline = async (requestId: string) => {
    const reason = prompt('Optional: Provide a brief reason for declining (e.g. at capacity, domain mismatch):');
    if (reason === null) return;

    const res = await fetchApi<any>(`/requests/${requestId}/decline`, {
      method: 'POST',
      body: JSON.stringify({ declineReason: reason || 'Not available at this time' }),
    });

    if (res.success) {
      setToastMessage('Mentorship request declined.');
      loadRequests();
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/[0.06]">
        <div>
          <Breadcrumb
            items={[
              { label: 'Campus' },
              { label: 'Mentor Portal' },
              { label: 'Inbound Requests' },
            ]}
          />
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mt-2">
            Incoming Mentorship Requests Queue
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Review applicant background and learning goals. Capacity invariant guarantees zero over-allocation.
          </p>
        </div>

        <div className="apple-card px-4 py-2 bg-white flex items-center gap-3 border border-black/[0.06]">
          <span className="text-xs text-neutral-500">Mentee Capacity:</span>
          <span className="text-sm font-bold text-neutral-900">
            {capacity?.currentActiveMentees ?? 0} / {capacity?.maxActiveMentees ?? 3} Active
          </span>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/60 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="apple-card bg-white border border-black/[0.06] overflow-hidden">
        <div className="p-5 border-b border-black/[0.04] flex items-center justify-between">
          <h3 className="font-bold text-sm text-neutral-900">Pending Student Applications</h3>
          <span className="text-xs text-neutral-400">{pendingRequests.length} Awaiting Decision</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-neutral-400">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-400">
            No incoming mentorship requests at this time.
          </div>
        ) : (
          <div className="divide-y divide-black/[0.04]">
            {requests.map((req) => (
              <div
                key={req._id}
                className="p-5 hover:bg-neutral-50/50 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-neutral-900">
                      {req.studentId?.userId?.firstName} {req.studentId?.userId?.lastName}
                    </span>
                    <span className="text-xs text-neutral-400">•</span>
                    <span className="text-xs text-neutral-600 font-medium">
                      Class of {req.studentId?.expectedGraduationYear || '2026'} ({req.studentId?.department || 'CS'})
                    </span>
                  </div>

                  <p className="text-xs text-neutral-700 bg-neutral-50 p-2.5 rounded-xl border border-neutral-100">
                    &ldquo;{req.statementOfIntent}&rdquo;
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(req.learningGoals || []).map((g: string, gIdx: number) => (
                      <span
                        key={gIdx}
                        className="px-2 py-0.5 rounded-full text-[10px] bg-blue-50 text-blue-700 font-medium"
                      >
                        Goal: {g}
                      </span>
                    ))}
                  </div>

                  <div className="text-[10px] text-neutral-400">
                    Received on {new Date(req.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {req.status === 'PENDING' ? (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAccept(req._id)}
                        className="rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Accept
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDecline(req._id)}
                        className="rounded-full text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        Decline
                      </Button>
                    </>
                  ) : (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        req.status === 'ACCEPTED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {req.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

