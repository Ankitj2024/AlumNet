'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Inbox,
  Users,
  Briefcase,
  Zap,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  PlayCircle,
  Clock,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { Breadcrumb } from '@/components/arc/breadcrumb/breadcrumb';
import { MetricCard } from '@/components/arc/metric-card/metric-card';
import { Switch } from '@/components/arc/switch/switch';

export default function MentorDashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [capacity, setCapacity] = useState<any>(null);
  const [inboundRequests, setInboundRequests] = useState<any[]>([]);
  const [mentorships, setMentorships] = useState<any[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const [profRes, capRes, reqRes, mentRes] = await Promise.all([
          fetchApi<any>('/alumni/profile/me'),
          fetchApi<any>('/alumni/capacity/me'),
          fetchApi<any[]>('/requests/received'),
          fetchApi<any[]>('/mentorships'),
        ]);

        if (profRes.success && profRes.data) {
          setProfile(profRes.data);
        }
        if (capRes.success && capRes.data) {
          setCapacity(capRes.data);
          setIsPaused(capRes.data.isPaused ?? false);
        }
        if (reqRes.success && reqRes.data) {
          setInboundRequests(reqRes.data);
        }
        if (mentRes.success && mentRes.data) {
          setMentorships(mentRes.data);
        }
      } catch (err) {
        console.error('Failed to load mentor dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const handleTogglePause = async (checked: boolean) => {
    const endpoint = checked ? '/alumni/capacity/pause' : '/alumni/capacity/resume';
    const res = await fetchApi<any>(endpoint, { method: 'POST' });

    if (res.success && res.data) {
      setIsPaused(checked);
      setCapacity(res.data);
      setToastMessage(
        checked
          ? 'Mentoring temporarily paused. You will not receive new requests.'
          : 'Mentoring active! You are discoverable to matching students.'
      );
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const pendingCount = inboundRequests.filter((r) => r.status === 'PENDING').length;
  const isVerified = profile?.verificationStatus === 'VERIFIED';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-black/[0.06]">
        <div>
          <Breadcrumb
            items={[
              { label: 'Campus' },
              { label: 'Mentor Portal' },
              { label: 'Dashboard' },
            ]}
          />
          <div className="flex items-center gap-2.5 mt-2">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
              Welcome, {profile?.userId?.firstName || 'Mentor'}
            </h1>
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-semibold ${
                isVerified
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                  : 'bg-amber-50 text-amber-800 border border-amber-200/60'
              }`}
            >
              {isVerified ? 'Institutionally Verified' : 'Pending Verification'}
            </span>
          </div>
          <p className="text-sm text-neutral-500 mt-0.5">
            Manage your professional availability, mentee capacity limits, and active student workspaces.
          </p>
        </div>

        {/* Capacity Load Quick Card */}
        <div className="apple-card px-5 py-3.5 bg-white flex items-center gap-4 border border-black/[0.06] shadow-xs">
          <div className="p-2.5 rounded-xl bg-neutral-100 text-neutral-900">
            <Zap className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              Mentee Capacity Load
            </div>
            <div className="text-lg font-bold text-neutral-900">
              {capacity?.currentActiveMentees ?? 0} / {capacity?.maxActiveMentees ?? 3}{' '}
              <span className="text-xs text-neutral-400 font-normal">Active</span>
            </div>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Availability Status & Pause Control Bar */}
      <div className="apple-card p-5 bg-white border border-black/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${isPaused ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {isPaused ? <PauseCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
          </div>
          <div>
            <div className="font-bold text-sm text-neutral-900">
              {isPaused ? 'Mentoring Paused' : 'Active & Accepting Requests'}
            </div>
            <div className="text-xs text-neutral-500">
              {isPaused
                ? 'Your profile is temporarily hidden from recommendation results. Active mentees remain unaffected.'
                : 'Eligible students can discover your profile and submit mentorship requests.'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <span className="text-xs font-semibold text-neutral-600">Pause Mentoring:</span>
          <Switch checked={isPaused} onCheckedChange={handleTogglePause} />
        </div>
      </div>

      {/* Key MetricCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Active Mentees"
          value={capacity?.currentActiveMentees ?? 0}
          suffix={` of ${capacity?.maxActiveMentees ?? 3} Max`}
          context="Atomic capacity protected"
          change="Under control"
        />
        <MetricCard
          label="Pending Inbound Requests"
          value={pendingCount}
          suffix=" Needs Review"
          context="Awaiting your decision"
          change={pendingCount > 0 ? `+${pendingCount}` : 'None'}
        />
        <MetricCard
          label="Years of Experience"
          value={profile?.yearsOfExperience || 6}
          suffix=" Years"
          context="Professional industry background"
          change="Verified"
        />
        <MetricCard
          label="Mentorship Health"
          value={100}
          suffix="%"
          context="All active relations healthy"
          change="Compliant"
        />
      </div>

      {/* Inbound Requests Alert Banner */}
      {pendingCount > 0 && (
        <div className="apple-card p-5 bg-white border border-amber-200/70 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-neutral-900">
                You have {pendingCount} mentorship request{pendingCount > 1 ? 's' : ''} awaiting review
              </div>
              <div className="text-xs text-neutral-500">
                Review students’ learning goals and accept within your available mentee capacity.
              </div>
            </div>
          </div>

          <Link
            href="/mentor/requests"
            className="px-4 py-2 rounded-full text-xs font-semibold bg-neutral-900 text-white hover:bg-black transition shrink-0"
          >
            Review Queue &rarr;
          </Link>
        </div>
      )}

      {/* Quick Action Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Requests */}
        <Link
          href="/mentor/requests"
          className="apple-card p-6 bg-white border border-black/[0.06] hover:border-blue-400 hover:shadow-md transition group flex flex-col justify-between"
        >
          <div>
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 w-fit mb-4 group-hover:scale-105 transition">
              <Inbox className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-neutral-900 group-hover:text-blue-600 transition">
              Inbound Mentorship Requests
            </h3>
            <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
              Accept or decline student applications with atomic capacity safety guarantees.
            </p>
          </div>
          <div className="text-xs font-semibold text-blue-600 flex items-center gap-1 mt-6">
            <span>Manage Queue ({pendingCount} Pending)</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </div>
        </Link>

        {/* Card 2: Mentees */}
        <Link
          href="/mentor/mentorships"
          className="apple-card p-6 bg-white border border-black/[0.06] hover:border-emerald-400 hover:shadow-md transition group flex flex-col justify-between"
        >
          <div>
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 w-fit mb-4 group-hover:scale-105 transition">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-neutral-900 group-hover:text-emerald-600 transition">
              My Active Mentees
            </h3>
            <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
              Access workspaces for video call agendas, collaborative milestones, and secure chat.
            </p>
          </div>
          <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1 mt-6">
            <span>Open Workspaces ({mentorships.length})</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </div>
        </Link>

        {/* Card 3: Verification */}
        <Link
          href="/mentor/verification"
          className="apple-card p-6 bg-white border border-black/[0.06] hover:border-amber-400 hover:shadow-md transition group flex flex-col justify-between"
        >
          <div>
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 w-fit mb-4 group-hover:scale-105 transition">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-neutral-900 group-hover:text-amber-600 transition">
              Identity Verification
            </h3>
            <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
              Check your registrar matching audit record and ensure verified badge status.
            </p>
          </div>
          <div className="text-xs font-semibold text-amber-600 flex items-center gap-1 mt-6">
            <span>{isVerified ? 'Verified & Active' : 'Submit Credentials'}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </div>
        </Link>

        {/* Card 4: Profile & Capacity */}
        <Link
          href="/mentor/profile"
          className="apple-card p-6 bg-white border border-black/[0.06] hover:border-purple-400 hover:shadow-md transition group flex flex-col justify-between"
        >
          <div>
            <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 w-fit mb-4 group-hover:scale-105 transition">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-neutral-900 group-hover:text-purple-600 transition">
              Profile & Capacity Bounds
            </h3>
            <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
              Configure maximum mentee limits (1 to 10), technical expertise tags, and bio.
            </p>
          </div>
          <div className="text-xs font-semibold text-purple-600 flex items-center gap-1 mt-6">
            <span>Configure Capacity</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </div>
        </Link>
      </div>
    </div>
  );
}
