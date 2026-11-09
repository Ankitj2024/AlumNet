'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { Breadcrumb } from '@/components/arc/breadcrumb/breadcrumb';

export default function OfficerMentorshipsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHealth() {
      setLoading(true);
      const res = await fetchApi<any>('/analytics/dashboard');
      if (res.success && res.data) {
        setAnalytics(res.data);
      }
      setLoading(false);
    }

    loadHealth();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/[0.06]">
        <div>
          <Breadcrumb
            items={[
              { label: 'Campus' },
              { label: 'Advancement' },
              { label: 'Health Oversight' },
            ]}
          />
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mt-2">
            Institutional Mentorship Health Oversight
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Continuous tracking of student-alumni interactions against 14-day and 28-day institutional inactivity thresholds.
          </p>
        </div>
      </div>

      {/* Health Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="apple-card p-5 bg-white border border-emerald-100/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Healthy Status</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">
            {analytics?.healthBreakdown?.healthy || 0}
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Active session or message exchanged within the last 14 days.
          </p>
        </div>

        <div className="apple-card p-5 bg-white border border-amber-100/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">At-Risk Status</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">
            {analytics?.healthBreakdown?.atRisk || 0}
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            No activity detected between 15 and 28 days.
          </p>
        </div>

        <div className="apple-card p-5 bg-white border border-rose-100/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Dormant Status</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">
            {analytics?.healthBreakdown?.dormant || 0}
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Inactivity exceeds 28 days. Candidate for officer nudges or graceful closure.
          </p>
        </div>
      </div>

      {/* Policy Details */}
      <div className="apple-card p-6 bg-white border border-black/[0.06] space-y-4">
        <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          Institutional Health Rules & Intervention Matrix
        </h3>

        <div className="space-y-3 text-xs text-neutral-600">
          <div className="p-4 rounded-xl bg-[#f5f5f7] flex items-start gap-3">
            <Clock className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold text-neutral-900">14-Day Nudge Trigger:</div>
              <div>
                When an active mentorship has no recorded meetings or messages for 14 calendar days, an automated reminder is queued for both participants.
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#f5f5f7] flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold text-neutral-900">28-Day At-Risk Intervention:</div>
              <div>
                Relationships exceeding 28 days of silence are flagged to the Alumni Relations Office to free up mentor capacity if the student has completed their objectives.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

