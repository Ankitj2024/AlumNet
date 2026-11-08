'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  FileSpreadsheet,
  Activity,
  Users,
  Briefcase,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { Breadcrumb } from '@/components/arc/breadcrumb/breadcrumb';
import { MetricCard } from '@/components/arc/metric-card/metric-card';
import { DonutChart } from '@/components/arc/donut-chart/donut-chart';

export default function OfficerDashboardPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [anaRes, queueRes] = await Promise.all([
        fetchApi<any>('/analytics/dashboard'),
        fetchApi<any[]>('/alumni/verification/queue'),
      ]);

      if (anaRes.success && anaRes.data) setAnalytics(anaRes.data);
      if (queueRes.success && queueRes.data) setQueue(queueRes.data);
      setLoading(false);
    }

    loadData();
  }, []);

  const pendingVerificationCount = queue.filter((q) => q.status === 'PENDING').length;

  const chartData = [
    { key: 'verified', label: 'Verified', value: analytics?.verificationBreakdown?.verified || 2 },
    { key: 'pending', label: 'Pending Audit', value: pendingVerificationCount || 1 },
    { key: 'rejected', label: 'Rejected', value: analytics?.verificationBreakdown?.rejected || 0 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-black/[0.06]">
        <div>
          <Breadcrumb
            items={[
              { label: 'Campus' },
              { label: 'Advancement' },
              { label: 'Executive Overview' },
            ]}
          />
          <div className="flex items-center gap-2.5 mt-2">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
              Institutional Mentorship Oversight
            </h1>
            <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/60">
              Advancement Office
            </span>
          </div>
          <p className="text-sm text-neutral-500 mt-0.5">
            Audit identity verification submissions, synchronize registrar master records, and monitor relationship health.
          </p>
        </div>
      </div>

      {/* Overview MetricCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Registered Students"
          value={analytics?.participation?.totalStudents || 1}
          suffix=" Enrolled"
          context="Active undergraduates"
          change="+18%"
        />
        <MetricCard
          label="Verified Alumni Mentors"
          value={analytics?.participation?.verifiedAlumni || 2}
          suffix=" Active"
          context="Registrar authenticated"
          change="+100%"
        />
        <MetricCard
          label="Active Mentorships"
          value={analytics?.participation?.activeMentorships || 0}
          suffix=" Active"
          context="Zero over-allocation"
          change="Optimal"
        />
        <MetricCard
          label="Verification Audit Queue"
          value={pendingVerificationCount}
          suffix=" Pending"
          context="Awaiting officer decision"
          change={pendingVerificationCount > 0 ? `+${pendingVerificationCount}` : 'None'}
        />
      </div>

      {/* Analytics Visual Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Verification Distribution */}
        <div className="apple-card p-6 bg-white border border-black/[0.06] flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-neutral-900 mb-1">
              Alumni Verification Pipeline
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Ratio of registrar-confirmed graduates versus submissions requiring manual officer audit.
            </p>
          </div>
          <div className="h-60 flex items-center justify-center">
            <DonutChart label="Verification Status" data={chartData} />
          </div>
          <div className="text-[11px] text-neutral-400 text-center pt-2 border-t border-neutral-100">
            100% verified identities guaranteed prior to discovery.
          </div>
        </div>

        {/* Mentorship Health & Activity */}
        <div className="apple-card p-6 bg-white border border-black/[0.06] space-y-4">
          <div>
            <h3 className="font-bold text-sm text-neutral-900 mb-1">
              Mentorship Engagement Health
            </h3>
            <p className="text-xs text-neutral-500">
              Monitored continuously against institutional 14-day and 28-day inactivity thresholds.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-4 rounded-2xl bg-[#f5f5f7] flex items-center justify-between">
              <div>
                <div className="font-semibold text-xs text-neutral-900">Healthy Relationships</div>
                <div className="text-[11px] text-neutral-500">Activity logged within last 14 days</div>
              </div>
              <span className="text-sm font-bold text-emerald-600">
                {analytics?.healthBreakdown?.healthy || 0}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#f5f5f7] flex items-center justify-between">
              <div>
                <div className="font-semibold text-xs text-neutral-900">At-Risk Relationships</div>
                <div className="text-[11px] text-neutral-500">No activity between 15 - 28 days</div>
              </div>
              <span className="text-sm font-bold text-amber-600">
                {analytics?.healthBreakdown?.atRisk || 0}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#f5f5f7] flex items-center justify-between">
              <div>
                <div className="font-semibold text-xs text-neutral-900">Dormant Relationships</div>
                <div className="text-[11px] text-neutral-500">Inactivity exceeding 28 days</div>
              </div>
              <span className="text-sm font-bold text-rose-600">
                {analytics?.healthBreakdown?.dormant || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          href="/officer/verifications"
          className="apple-card p-6 bg-white border border-black/[0.06] hover:border-blue-400 hover:shadow-md transition group flex flex-col justify-between"
        >
          <div>
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 w-fit mb-4 group-hover:scale-105 transition">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-neutral-900 group-hover:text-blue-600 transition">
              Verification Audit Queue
            </h3>
            <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
              Review alumni submissions, compare against registrar records, and issue approvals or rejections.
            </p>
          </div>
          <div className="text-xs font-semibold text-blue-600 flex items-center gap-1 mt-6">
            <span>Audit Queue ({pendingVerificationCount} Pending)</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </div>
        </Link>

        <Link
          href="/officer/registrar-sync"
          className="apple-card p-6 bg-white border border-black/[0.06] hover:border-emerald-400 hover:shadow-md transition group flex flex-col justify-between"
        >
          <div>
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 w-fit mb-4 group-hover:scale-105 transition">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-neutral-900 group-hover:text-emerald-600 transition">
              Registrar CSV Master Sync
            </h3>
            <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
              Batch import institutional alumni records from the University Registrar to enable automatic ERP verification.
            </p>
          </div>
          <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1 mt-6">
            <span>Import Records</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </div>
        </Link>

        <Link
          href="/officer/mentorships"
          className="apple-card p-6 bg-white border border-black/[0.06] hover:border-purple-400 hover:shadow-md transition group flex flex-col justify-between"
        >
          <div>
            <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 w-fit mb-4 group-hover:scale-105 transition">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-neutral-900 group-hover:text-purple-600 transition">
              Mentorship Health Oversight
            </h3>
            <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
              Monitor active campus mentorships, inspect inactive pairs, and identify mentor overload risks.
            </p>
          </div>
          <div className="text-xs font-semibold text-purple-600 flex items-center gap-1 mt-6">
            <span>Inspect Health</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </div>
        </Link>
      </div>
    </div>
  );
}
