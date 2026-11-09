'use client';

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  ShieldAlert,
  CheckCircle2,
  History,
  AlertTriangle,
  Lock,
  Save,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/arc/button/button';

interface MatchingWeights {
  expertiseWeight: number;
  roleWeight: number;
  industryWeight: number;
  mentoringInterestWeight: number;
  availabilityWeight: number;
}

interface RequestLimits {
  maxPendingRequestsPerStudent: number;
  maxRequestsPerRollingPeriod: number;
  rollingPeriodDays: number;
  requestExpiryDays: number;
}

interface CapacityBounds {
  minMentorCapacity: number;
  maxMentorCapacity: number;
}

interface EngagementThresholds {
  atRiskDays: number;
  dormantDays: number;
  dormantGraceDays: number;
}

interface ProgrammeSettings {
  _id: string;
  matchingWeights: MatchingWeights;
  requestLimits: RequestLimits;
  capacityBounds: CapacityBounds;
  engagementThresholds: EngagementThresholds;
  changeHistory: Array<{
    modifiedBy: string;
    modifiedByName?: string;
    modifiedAt: string;
    previousSettings: any;
    newSettings: any;
    reason?: string;
  }>;
  version: number;
  updatedAt: string;
}

export default function ProgrammePolicyPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [weights, setWeights] = useState<MatchingWeights>({
    expertiseWeight: 0.4,
    roleWeight: 0.2,
    industryWeight: 0.15,
    mentoringInterestWeight: 0.1,
    availabilityWeight: 0.15,
  });

  const [requestLimits, setRequestLimits] = useState<RequestLimits>({
    maxPendingRequestsPerStudent: 3,
    maxRequestsPerRollingPeriod: 5,
    rollingPeriodDays: 7,
    requestExpiryDays: 7,
  });

  const [capacityBounds, setCapacityBounds] = useState<CapacityBounds>({
    minMentorCapacity: 1,
    maxMentorCapacity: 10,
  });

  const [thresholds, setThresholds] = useState<EngagementThresholds>({
    atRiskDays: 14,
    dormantDays: 28,
    dormantGraceDays: 7,
  });

  const [reason, setReason] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [version, setVersion] = useState(1);

  const totalWeight =
    (weights.expertiseWeight || 0) +
    (weights.roleWeight || 0) +
    (weights.industryWeight || 0) +
    (weights.mentoringInterestWeight || 0) +
    (weights.availabilityWeight || 0);

  const isWeightValid = Math.abs(totalWeight - 1.0) < 0.001;

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetchApi<ProgrammeSettings>('/programme-settings');
      if (res.success && res.data) {
        const d = res.data;
        if (d.matchingWeights) setWeights(d.matchingWeights);
        if (d.requestLimits) setRequestLimits(d.requestLimits);
        if (d.capacityBounds) setCapacityBounds(d.capacityBounds);
        if (d.engagementThresholds) setThresholds(d.engagementThresholds);
        if (d.changeHistory) setHistory(d.changeHistory);
        if (d.version) setVersion(d.version);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      setErrorMsg('Unauthorized: Only Super Administrators can save policy modifications.');
      return;
    }

    if (!isWeightValid) {
      setErrorMsg(`Matching weights must sum exactly to 1.0 (current sum: ${totalWeight.toFixed(2)}).`);
      return;
    }

    if (!reason.trim()) {
      setErrorMsg('Please specify an audit justification reason for this policy update.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setSaving(true);

    try {
      const res = await fetchApi<ProgrammeSettings>('/programme-settings', {
        method: 'PUT',
        body: JSON.stringify({
          matchingWeights: weights,
          requestLimits,
          capacityBounds,
          engagementThresholds: thresholds,
          reason,
        }),
      });

      if (res.success && res.data) {
        setSuccessMsg(`Programme policy updated successfully (v${res.data.version}). Settings cache invalidated.`);
        setReason('');
        loadSettings();
      } else {
        setErrorMsg(res.error?.message || 'Failed to update programme settings.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="p-8 text-center text-xs text-neutral-500">Loading programme policies...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800">
              Governance v{version}
            </span>
            <span className="text-xs text-neutral-400">Live Policy Configuration</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mt-1">
            Programme Policy & Matching Weight Engine
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Institutional governance parameters controlling matching algorithms, capacity safeguards, and health thresholds.
          </p>
        </div>

        {!isSuperAdmin && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
            <Lock className="w-3.5 h-3.5" />
            <span>Read-Only Mode (Super Admin Required to Modify)</span>
          </div>
        )}
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Matching Weights */}
        <div className="apple-card p-6 bg-white space-y-5">
          <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
            <div>
              <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-purple-600" />
                Matching Engine Component Weights
              </h2>
              <p className="text-[11px] text-neutral-500">
                Weights must sum exactly to 1.0 (100%). Used by the multi-factor explainable recommendation engine.
              </p>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                isWeightValid
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
              }`}
            >
              Sum: {totalWeight.toFixed(2)} / 1.00 {isWeightValid ? '✓ Valid' : '✗ Must equal 1.0'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                Expertise & Skills
              </label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                disabled={!isSuperAdmin}
                value={weights.expertiseWeight}
                onChange={(e) =>
                  setWeights({ ...weights, expertiseWeight: parseFloat(e.target.value) || 0 })
                }
                className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
              />
              <span className="text-[10px] text-neutral-400 mt-1 block">Default: 0.40</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                Target Role
              </label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                disabled={!isSuperAdmin}
                value={weights.roleWeight}
                onChange={(e) =>
                  setWeights({ ...weights, roleWeight: parseFloat(e.target.value) || 0 })
                }
                className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
              />
              <span className="text-[10px] text-neutral-400 mt-1 block">Default: 0.20</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                Industry Affinity
              </label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                disabled={!isSuperAdmin}
                value={weights.industryWeight}
                onChange={(e) =>
                  setWeights({ ...weights, industryWeight: parseFloat(e.target.value) || 0 })
                }
                className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
              />
              <span className="text-[10px] text-neutral-400 mt-1 block">Default: 0.15</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                Mentoring Topics
              </label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                disabled={!isSuperAdmin}
                value={weights.mentoringInterestWeight}
                onChange={(e) =>
                  setWeights({
                    ...weights,
                    mentoringInterestWeight: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
              />
              <span className="text-[10px] text-neutral-400 mt-1 block">Default: 0.10</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                Schedule Availability
              </label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                disabled={!isSuperAdmin}
                value={weights.availabilityWeight}
                onChange={(e) =>
                  setWeights({ ...weights, availabilityWeight: parseFloat(e.target.value) || 0 })
                }
                className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
              />
              <span className="text-[10px] text-neutral-400 mt-1 block">Default: 0.15</span>
            </div>
          </div>
        </div>

        {/* Section 2: Request Throttling & Capacity Safeguards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="apple-card p-6 bg-white space-y-4">
            <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5 border-b border-black/[0.06] pb-3">
              <ShieldAlert className="w-4 h-4 text-blue-600" />
              Request Quotas & Anti-Spam Throttles
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Max Pending Requests per Student
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  disabled={!isSuperAdmin}
                  value={requestLimits.maxPendingRequestsPerStudent}
                  onChange={(e) =>
                    setRequestLimits({
                      ...requestLimits,
                      maxPendingRequestsPerStudent: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
                />
                <span className="text-[10px] text-neutral-400">Limits concurrent pending outreach to prevent shotgun applications.</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Max Requests per Rolling Window
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  disabled={!isSuperAdmin}
                  value={requestLimits.maxRequestsPerRollingPeriod}
                  onChange={(e) =>
                    setRequestLimits({
                      ...requestLimits,
                      maxRequestsPerRollingPeriod: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
                />
                <span className="text-[10px] text-neutral-400">Default: 5 requests per rolling period.</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    Rolling Window (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    disabled={!isSuperAdmin}
                    value={requestLimits.rollingPeriodDays}
                    onChange={(e) =>
                      setRequestLimits({
                        ...requestLimits,
                        rollingPeriodDays: parseInt(e.target.value) || 7,
                      })
                    }
                    className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    Request Expiry (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    disabled={!isSuperAdmin}
                    value={requestLimits.requestExpiryDays}
                    onChange={(e) =>
                      setRequestLimits({
                        ...requestLimits,
                        requestExpiryDays: parseInt(e.target.value) || 7,
                      })
                    }
                    className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Mentor Capacity Bounds & Health Thresholds */}
          <div className="apple-card p-6 bg-white space-y-4">
            <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5 border-b border-black/[0.06] pb-3">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Capacity Invariants & Health Thresholds
            </h2>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    Min Mentor Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    disabled={!isSuperAdmin}
                    value={capacityBounds.minMentorCapacity}
                    onChange={(e) =>
                      setCapacityBounds({
                        ...capacityBounds,
                        minMentorCapacity: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    Max Mentor Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    disabled={!isSuperAdmin}
                    value={capacityBounds.maxMentorCapacity}
                    onChange={(e) =>
                      setCapacityBounds({
                        ...capacityBounds,
                        maxMentorCapacity: parseInt(e.target.value) || 10,
                      })
                    }
                    className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  At-Risk Threshold (Days Inactive)
                </label>
                <input
                  type="number"
                  min="7"
                  max="30"
                  disabled={!isSuperAdmin}
                  value={thresholds.atRiskDays}
                  onChange={(e) =>
                    setThresholds({
                      ...thresholds,
                      atRiskDays: parseInt(e.target.value) || 14,
                    })
                  }
                  className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
                />
                <span className="text-[10px] text-neutral-400">Triggers health nudges when no session or message has occurred within this window (14d).</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    Dormant Threshold (Days)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="60"
                    disabled={!isSuperAdmin}
                    value={thresholds.dormantDays}
                    onChange={(e) =>
                      setThresholds({
                        ...thresholds,
                        dormantDays: parseInt(e.target.value) || 28,
                      })
                    }
                    className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    Dormant Grace (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    disabled={!isSuperAdmin}
                    value={thresholds.dormantGraceDays}
                    onChange={(e) =>
                      setThresholds({
                        ...thresholds,
                        dormantGraceDays: parseInt(e.target.value) || 7,
                      })
                    }
                    className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Justification & Save */}
        {isSuperAdmin && (
          <div className="apple-card p-6 bg-white space-y-4 border-2 border-purple-100">
            <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
              <Save className="w-4 h-4 text-purple-600" />
              Administrative Audit Justification
            </h2>
            <p className="text-[11px] text-neutral-500">
              Every modification to programme settings is immutably recorded in the institutional audit log and change ledger.
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                Reason / RFC Justification *
              </label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Adjusted matching weights to prioritize role overlap for Fall 2026 cohort"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={loadSettings}
                className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                Reset to Current
              </button>
              <button
                type="submit"
                disabled={saving || !isWeightValid}
                className="px-5 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-black disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving ? 'Validating & Committing...' : 'Commit Policy Revisions'}
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Change History Ledger */}
      <div className="apple-card p-6 bg-white space-y-4">
        <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
          <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
            <History className="w-4 h-4 text-neutral-600" />
            Policy Change History & Audit Trail
          </h2>
          <span className="text-[11px] text-neutral-400 font-medium">{history.length} revision(s)</span>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400">
            No policy modifications have been recorded yet. System is operating on default baseline governance parameters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-100">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Modified By</th>
                  <th className="py-2.5 px-3">Reason / Justification</th>
                  <th className="py-2.5 px-3">Summary of Changes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {history.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50/60">
                    <td className="py-3 px-3 text-neutral-600 font-mono text-[11px] whitespace-nowrap">
                      {new Date(entry.modifiedAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-medium text-neutral-900">
                      {entry.modifiedByName || 'Super Administrator'}
                    </td>
                    <td className="py-3 px-3 text-neutral-700 italic">
                      "{entry.reason || 'No description provided'}"
                    </td>
                    <td className="py-3 px-3 text-neutral-500 font-mono text-[10px]">
                      {entry.newSettings?.matchingWeights
                        ? `Weights: [${entry.newSettings.matchingWeights.expertiseWeight}, ${entry.newSettings.matchingWeights.roleWeight}, ${entry.newSettings.matchingWeights.industryWeight}, ${entry.newSettings.matchingWeights.mentoringInterestWeight}, ${entry.newSettings.matchingWeights.availabilityWeight}]`
                        : 'Parameters revised'}
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
