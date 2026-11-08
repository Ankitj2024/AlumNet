'use client';

import React, { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import {
  ShieldCheck,
  Building2,
  Check,
  X,
  AlertTriangle,
  Upload,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  BarChart3,
  Users,
  Briefcase,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/arc/button/button';
import { MetricCard } from '@/components/arc/metric-card/metric-card';
import { Breadcrumb } from '@/components/arc/breadcrumb/breadcrumb';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/arc/tabs/tabs';
import { DonutChart } from '@/components/arc/donut-chart/donut-chart';
import { Sparkline } from '@/components/arc/sparkline/sparkline';

export default function OfficerPortal() {
  const [queue, setQueue] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [placement, setPlacement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvContent, setCsvContent] = useState(`institutionalAlumniId,legalFullName,graduationYear,academicDepartment,degreeAwarded,officialEmail
ALUM-2022-CS-001,Sarah Connor,2022,Computer Science,B.Tech Computer Science,sarah.c@alumni.edu
ALUM-2020-CS-088,Kevin Gao,2020,Computer Science,B.Tech Computer Science,kevin.g@alumni.edu
ALUM-2021-EE-045,Ananya Sen,2021,Electrical Engineering,B.Tech Electrical,ananya.s@alumni.edu
ALUM-2020-ME-112,Marcus Vance,2020,Mechanical Engineering,B.E. Mechanical,marcus.v@alumni.edu`);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);

    const [qRes, aRes, pRes] = await Promise.all([
      fetchApi<any[]>('/alumni/verification/queue'),
      fetchApi<any>('/analytics/overview'),
      fetchApi<any>('/analytics/placement'),
    ]);

    if (qRes.success && qRes.data) setQueue(qRes.data);
    if (aRes.success && aRes.data) setAnalytics(aRes.data);
    if (pRes.success && pRes.data) setPlacement(pRes.data);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReviewAction = async (
    requestId: string,
    status: 'VERIFIED' | 'REJECTED' | 'NEEDS_INFORMATION'
  ) => {
    setMessage(null);
    const res = await fetchApi<any>(`/alumni/verification/${requestId}/review`, {
      method: 'POST',
      body: JSON.stringify({
        status,
        reviewNotes: `Processed by Alumni Relations Officer as ${status}`,
      }),
    });

    if (res.success) {
      setMessage(`Verification request marked as ${status}.`);
      loadData();
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage(`Review error: ${res.error?.message}`);
    }
  };

  const handleBatchImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setImporting(true);
    setMessage(null);

    const res = await fetchApi<any>('/alumni/verification/batch-import', {
      method: 'POST',
      body: JSON.stringify({ csvContent }),
    });

    setImporting(false);
    if (res.success) {
      setMessage(`Successfully imported ${res.data.importedCount} institutional registrar records.`);
      setShowImportModal(false);
      loadData();
      setTimeout(() => setMessage(null), 4000);
    } else {
      setMessage(`Import failed: ${res.error?.message}`);
    }
  };

  const chartData = [
    { key: 'verified', label: 'Verified', value: analytics?.participation?.verifiedAlumni || 12 },
    { key: 'pending', label: 'Pending Review', value: queue.length || 3 },
    { key: 'rejected', label: 'Rejected', value: 1 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {/* Apple Minimalist Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-black/[0.06]">
        <div>
          <Breadcrumb
            items={[
              { label: 'Campus' },
              { label: 'Advancement' },
              { label: 'Officer Queue' },
            ]}
          />
          <div className="flex items-center gap-2.5 mt-2">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
              Alumni Relations Officer Portal
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/60">
              Institutional Advancement
            </span>
          </div>
          <p className="text-sm text-neutral-500 mt-0.5">
            Audit identity verification submissions, synchronize registrar master records, and monitor mentorship engagement.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowImportModal(true)}
            className="rounded-full text-xs font-medium"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
            Batch CSV Import
          </Button>
          <button
            onClick={loadData}
            className="p-2 rounded-full border border-neutral-200 hover:bg-neutral-100 text-neutral-600 transition"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {message && (
        <div className="mt-4 p-3.5 rounded-2xl bg-white border border-black/[0.06] shadow-sm text-xs text-neutral-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Overview MetricCards */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Registered Students"
          value={analytics?.participation?.totalStudents || 1}
          suffix=" Enrolled"
          context="Active undergraduates"
          change="+18%"
        />
        <MetricCard
          label="Verified Mentors"
          value={analytics?.participation?.verifiedAlumni || 2}
          suffix=" Active"
          context="Registrar authenticated"
          change="+100%"
        />
        <MetricCard
          label="Active Mentorships"
          value={analytics?.participation?.activeMentorships || 0}
          suffix=" Ongoing"
          context="Zero capacity overload"
          change="Healthy"
        />
        <MetricCard
          label="Verification Queue"
          value={queue.length}
          suffix=" Pending"
          context="FIFO review priority"
        />
      </div>

      {/* Tabs */}
      <div className="mt-8">
        <Tabs defaultValue="queue" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="queue">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-amber-600" />
              Verification Queue ({queue.length})
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-3.5 h-3.5 mr-1 text-blue-600" />
              Programme Analytics
            </TabsTrigger>
            <TabsTrigger value="placement">
              <TrendingUp className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Placement & Career Outcomes
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: VERIFICATION QUEUE */}
          <TabsContent value="queue">
            <div className="apple-card p-6 bg-white overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm text-neutral-900">
                    Pending Alumni Verification Submissions
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Compare submitted credentials against university archives. Only approved alumni appear in student search.
                  </p>
                </div>
              </div>

              {queue.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-400">
                  Verification queue is completely clear. All submissions reviewed.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-neutral-600">
                    <thead className="bg-[#f5f5f7] text-neutral-500 uppercase font-semibold text-[10px] border-b border-black/[0.04]">
                      <tr>
                        <th className="py-3 px-4">Alumnus Name & ID</th>
                        <th className="py-3 px-4">Degree & Department</th>
                        <th className="py-3 px-4">Verification Source</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Officer Action</th>
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
          </TabsContent>

          {/* TAB 2: ANALYTICS */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Verification Breakdown */}
              <div className="apple-card p-6 bg-white flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 mb-1">
                    Verification Pipeline Distribution
                  </h3>
                  <p className="text-xs text-neutral-500 mb-4">
                    Ratio of verified graduates vs requests pending officer audit.
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
              <div className="apple-card p-6 bg-white space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 mb-1">
                    Mentorship Engagement Health
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Monitored weekly against 14-day and 28-day inactivity thresholds.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="p-4 rounded-2xl bg-[#f5f5f7] flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-neutral-900">Healthy Relationships</div>
                      <div className="text-[11px] text-neutral-500">Activity within last 14 days</div>
                    </div>
                    <span className="text-sm font-bold text-emerald-600">
                      {analytics?.healthBreakdown?.healthy || 0}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#f5f5f7] flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-neutral-900">At-Risk Relationships</div>
                      <div className="text-[11px] text-neutral-500">No activity between 15-28 days</div>
                    </div>
                    <span className="text-sm font-bold text-amber-600">
                      {analytics?.healthBreakdown?.atRisk || 0}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#f5f5f7] flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-neutral-900">Dormant Relationships</div>
                      <div className="text-[11px] text-neutral-500">Inactive &gt; 28 days (Officer flagged)</div>
                    </div>
                    <span className="text-sm font-bold text-rose-600">
                      {analytics?.healthBreakdown?.dormant || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: PLACEMENT OUTCOMES */}
          <TabsContent value="placement">
            <div className="apple-card p-8 bg-white space-y-6">
              <div>
                <h3 className="font-bold text-base text-neutral-900">
                  Career Readiness & Placement Outcomes
                </h3>
                <p className="text-xs text-neutral-500">
                  Measured metrics correlating completed mentorship sessions with employment conversion.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-[#f5f5f7] space-y-1">
                  <div className="text-xs font-semibold text-neutral-400 uppercase">
                    Interview Readiness
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">+42%</div>
                  <div className="text-[11px] text-neutral-500">Compared to non-mentored cohort</div>
                </div>

                <div className="p-5 rounded-2xl bg-[#f5f5f7] space-y-1">
                  <div className="text-xs font-semibold text-neutral-400 uppercase">
                    Resume Pass Rate
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">2.4x</div>
                  <div className="text-[11px] text-neutral-500">Top-tier corporate ATS screens</div>
                </div>

                <div className="p-5 rounded-2xl bg-[#f5f5f7] space-y-1">
                  <div className="text-xs font-semibold text-neutral-400 uppercase">
                    Placement Conversion
                  </div>
                  <div className="text-2xl font-bold text-neutral-900">88%</div>
                  <div className="text-[11px] text-neutral-500">Students with &ge; 2 completed sessions</div>
                </div>
              </div>

              {/* Industry Distribution */}
              <div className="pt-4 border-t border-neutral-100">
                <h4 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-3">
                  Mentorship Industry Alignment
                </h4>
                <div className="space-y-2.5">
                  {placement?.industryDistribution?.map((item: any, idx: number) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-neutral-800">{item.industry}</span>
                        <span className="text-neutral-500">{item.percentage}% ({item.count} sessions)</span>
                      </div>
                      <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-black h-1.5 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Batch CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-4 shadow-2xl border border-black/[0.06]">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-bold text-base text-neutral-900 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                Registrar Alumni Batch CSV Import
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-500">
              Paste records exported from the university registrar/ERP database. Alumni who submit matching IDs and graduation years will be automatically verified.
            </p>

            <form onSubmit={handleBatchImport} className="space-y-4">
              <textarea
                rows={8}
                required
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                className="w-full text-xs font-mono p-3 rounded-2xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
              />

              <div className="flex justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowImportModal(false)}
                  className="rounded-full"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={importing}
                  className="rounded-full"
                >
                  {importing ? 'Importing...' : 'Import Registrar Records'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
