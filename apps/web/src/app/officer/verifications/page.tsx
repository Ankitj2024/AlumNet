'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Check,
  X,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Clock,
  Building,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { Breadcrumb } from '@/components/arc/breadcrumb/breadcrumb';
import { Button } from '@/components/arc/button/button';

export default function OfficerVerificationsPage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadQueue = async () => {
    setLoading(true);
    const res = await fetchApi<any[]>('/alumni/verification/queue');
    if (res.success && res.data) {
      setQueue(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleReviewAction = async (requestId: string, action: 'VERIFIED' | 'REJECTED') => {
    let rejectionReason: string | null = null;
    if (action === 'REJECTED') {
      rejectionReason = prompt('Mandatory: Enter rejection reason (e.g. record not found, graduation year discrepancy):');
      if (!rejectionReason) return;
    }

    const res = await fetchApi<any>(`/alumni/verification/${requestId}/review`, {
      method: 'POST',
      body: JSON.stringify({
        status: action,
        reviewNotes: action === 'VERIFIED' ? 'Approved by Alumni Relations Officer audit.' : rejectionReason,
        rejectionReason: action === 'REJECTED' ? rejectionReason : undefined,
      }),
    });

    if (res.success) {
      setToastMessage(`Verification request ${action === 'VERIFIED' ? 'approved' : 'rejected'}.`);
      loadQueue();
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const pendingQueue = queue.filter((req) => req.status === 'PENDING');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/[0.06]">
        <div>
          <Breadcrumb
            items={[
              { label: 'Campus' },
              { label: 'Advancement' },
              { label: 'Verification Queue' },
            ]}
          />
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mt-2">
            Alumni Identity Verification Audit Queue
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Audit identity submissions against registrar records. Approving grants the mentor verified badge and search discovery.
          </p>
        </div>

        <Link href="/officer/registrar-sync">
          <Button variant="primary" size="sm" className="rounded-full text-xs font-semibold">
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
            Batch CSV Sync
          </Button>
        </Link>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="apple-card bg-white border border-black/[0.06] overflow-hidden">
        <div className="p-5 border-b border-black/[0.04] flex items-center justify-between">
          <h3 className="font-bold text-sm text-neutral-900">Submitted Verification Audits</h3>
          <span className="text-xs text-neutral-400">{pendingQueue.length} Awaiting Audit</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-neutral-400">Loading verification submissions...</div>
        ) : queue.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-400">
            No verification requests in queue at this time.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#fbfbfd] text-neutral-400 border-b border-black/[0.04]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Alumnus Name & ID</th>
                  <th className="py-3 px-4 font-semibold">Degree & Department</th>
                  <th className="py-3 px-4 font-semibold">Verification Method</th>
                  <th className="py-3 px-4 font-semibold">Audit Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {queue.map((req) => (
                  <tr key={req._id} className="hover:bg-neutral-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-neutral-900">
                        {req.userId?.firstName} {req.userId?.lastName}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono">
                        ID: {req.submittedAlumniId}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-neutral-800">{req.degree}</div>
                      <div className="text-[10px] text-neutral-400">
                        {req.academicDepartment} • Class of {req.graduationYear}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-neutral-100 text-neutral-700 font-medium">
                        {req.verificationMethod}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          req.status === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : req.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {req.status !== 'VERIFIED' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleReviewAction(req._id, 'VERIFIED')}
                            className="rounded-full text-xs bg-emerald-600 hover:bg-emerald-700 px-3"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleReviewAction(req._id, 'REJECTED')}
                            className="rounded-full text-xs text-rose-600 px-3"
                          >
                            <X className="w-3.5 h-3.5 mr-1" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Approved
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
