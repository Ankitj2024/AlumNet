'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { Breadcrumb } from '@/components/arc/breadcrumb/breadcrumb';
import { Button } from '@/components/arc/button/button';

export default function StudentRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    const res = await fetchApi<any[]>('/requests/sent');
    if (res.success && res.data) {
      setRequests(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleWithdraw = async (requestId: string) => {
    if (!confirm('Are you sure you want to withdraw this mentorship request?')) return;

    const res = await fetchApi<any>(`/requests/${requestId}/withdraw`, { method: 'POST' });
    if (res.success) {
      setToastMessage('Mentorship request successfully withdrawn.');
      loadRequests();
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/[0.06]">
        <div>
          <Breadcrumb
            items={[
              { label: 'Campus' },
              { label: 'Student Portal' },
              { label: 'Outgoing Requests' },
            ]}
          />
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mt-2">
            Mentorship Request Tracking
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Monitor the status of your sent requests and manage institutional anti-spam quota limits.
          </p>
        </div>

        <Link href="/student/discover">
          <Button variant="primary" size="sm" className="rounded-full text-xs font-semibold">
            <Send className="w-3.5 h-3.5 mr-1" />
            Find New Mentors
          </Button>
        </Link>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Quota Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="apple-card p-4 bg-white border border-black/[0.06] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              Pending Requests Quota
            </div>
            <div className="text-lg font-bold text-neutral-900 mt-0.5">
              {pendingCount} <span className="text-xs text-neutral-400 font-normal">/ 3 Concurrent Max</span>
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              pendingCount < 3 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
          >
            {pendingCount < 3 ? 'Quota Available' : 'Limit Reached'}
          </span>
        </div>

        <div className="apple-card p-4 bg-white border border-black/[0.06] flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              Rolling 7-Day Anti-Spam Policy
            </div>
            <div className="text-lg font-bold text-neutral-900 mt-0.5">
              {requests.length} <span className="text-xs text-neutral-400 font-normal">/ 5 Weekly Window</span>
            </div>
          </div>
          <span className="text-xs text-neutral-500 font-medium">Automatic Protection</span>
        </div>
      </div>

      {/* Requests List */}
      <div className="apple-card bg-white border border-black/[0.06] overflow-hidden">
        <div className="p-5 border-b border-black/[0.04] flex items-center justify-between">
          <h3 className="font-bold text-sm text-neutral-900">Submitted Requests Queue</h3>
          <span className="text-xs text-neutral-400">{requests.length} Total Requests</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-neutral-400">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-400">
            You have not sent any mentorship requests yet.
            <div className="mt-3">
              <Link href="/student/discover" className="text-blue-600 font-semibold hover:underline">
                Discover verified alumni &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-black/[0.04]">
            {requests.map((req) => (
              <div key={req._id} className="p-5 hover:bg-neutral-50/50 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-neutral-900">
                      {req.mentorId?.userId?.firstName} {req.mentorId?.userId?.lastName}
                    </span>
                    <span className="text-xs text-neutral-400">•</span>
                    <span className="text-xs text-neutral-600 font-medium">
                      {req.mentorId?.professionalDesignation || 'Alumni Mentor'}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-600 italic">
                    &ldquo;{req.statementOfIntent}&rdquo;
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(req.learningGoals || []).map((g: string, gIdx: number) => (
                      <span key={gIdx} className="px-2 py-0.5 rounded-full text-[10px] bg-neutral-100 text-neutral-600 font-medium">
                        Goal: {g}
                      </span>
                    ))}
                  </div>

                  <div className="text-[10px] text-neutral-400">
                    Submitted on {new Date(req.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      req.status === 'ACCEPTED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                        : req.status === 'PENDING'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200/50'
                        : req.status === 'DECLINED'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200/50'
                        : 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    {req.status}
                  </span>

                  {req.status === 'ACCEPTED' && (
                    <Link href="/student/mentorships">
                      <Button variant="primary" size="sm" className="rounded-full text-xs font-semibold">
                        Open Workspace &rarr;
                      </Button>
                    </Link>
                  )}

                  {req.status === 'PENDING' && (
                    <button
                      onClick={() => handleWithdraw(req._id)}
                      className="p-1.5 text-neutral-400 hover:text-rose-600 transition"
                      title="Withdraw Request"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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

