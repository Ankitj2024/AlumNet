'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Compass,
  Send,
  Users,
  Target,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Clock,
  Briefcase,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { Gauge } from '@/components/arc/gauge/gauge';
import { MetricCard } from '@/components/arc/metric-card/metric-card';
import { Countdown } from '@/components/arc/countdown/countdown';
import { Breadcrumb } from '@/components/arc/breadcrumb/breadcrumb';

export default function StudentDashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [mentorships, setMentorships] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [nextSession, setNextSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const [profRes, mentRes, reqRes] = await Promise.all([
          fetchApi<any>('/students/profile/me'),
          fetchApi<any[]>('/mentorships'),
          fetchApi<any[]>('/requests/sent'),
        ]);

        if (profRes.success && profRes.data) {
          setProfile(profRes.data);
        }
        if (mentRes.success && mentRes.data) {
          setMentorships(mentRes.data);
          // Find next upcoming scheduled session
          const allSessions = mentRes.data.flatMap((m: any) => m.sessions || []);
          const upcoming = allSessions
            .filter((s: any) => s.status === 'SCHEDULED' && new Date(s.scheduledStartTime) > new Date())
            .sort((a: any, b: any) => new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime());
          if (upcoming.length > 0) {
            setNextSession(upcoming[0]);
          }
        }
        if (reqRes.success && reqRes.data) {
          setRequests(reqRes.data);
        }
      } catch (err) {
        console.error('Failed to load student dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const pendingRequestsCount = requests.filter((r) => r.status === 'PENDING').length;
  const completionScore = profile?.profileCompletionScore || 20;

  return (
    <div className="space-y-8">
      {/* Breadcrumb & Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-black/[0.06]">
        <div>
          <Breadcrumb
            items={[
              { label: 'Campus' },
              { label: 'Student Portal' },
              { label: 'Dashboard' },
            ]}
          />
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 mt-2">
            Welcome back, {profile?.userId?.firstName || 'Student'}
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Institutional career development, verified alumni matching, and active mentorship workspaces.
          </p>
        </div>

        {/* Profile Readiness Gauge Card */}
        <div className="apple-card px-5 py-3.5 bg-white flex items-center gap-4 border border-black/[0.06] shadow-xs">
          <div className="w-12 h-12 flex items-center justify-center">
            <Gauge label="Profile Readiness" value={completionScore} min={0} max={100} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              Profile Readiness
            </div>
            <div className="text-lg font-bold text-neutral-900">
              {completionScore}%
            </div>
          </div>
        </div>
      </div>

      {/* Overview MetricCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Active Mentorships"
          value={mentorships.length}
          suffix=" Active"
          context="Institutional connections"
          change={mentorships.length > 0 ? '+1' : '0'}
        />
        <MetricCard
          label="Pending Requests"
          value={pendingRequestsCount}
          suffix=" of 3 Max"
          context="Anti-spam protected"
          change="Live quota"
        />
        <MetricCard
          label="Target Roles"
          value={profile?.targetJobRoles?.length || 1}
          suffix=" Configured"
          context="Weighted algorithm input"
          change="Optimized"
        />
        <MetricCard
          label="Preferred Industries"
          value={profile?.preferredIndustries?.length || 1}
          suffix=" Selected"
          context="Matched against mentors"
          change="Active"
        />
      </div>

      {/* Next Upcoming Session Banner (if any) */}
      {nextSession && (
        <div className="apple-card p-6 bg-white border border-blue-100/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                Upcoming Mentorship Session
              </span>
              <h3 className="text-base font-bold text-neutral-900 mt-1">
                {nextSession.agenda || '1-on-1 Mentorship Session'}
              </h3>
              <p className="text-xs text-neutral-500">
                Scheduled for {new Date(nextSession.scheduledStartTime).toLocaleString()}
              </p>
              {nextSession.meetingLink && (
                <a
                  href={nextSession.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 font-semibold hover:underline mt-1 inline-flex items-center gap-1"
                >
                  Join Google Meet Call &rarr;
                </a>
              )}
            </div>
          </div>

          <div className="md:text-right shrink-0">
            <div className="text-[11px] font-semibold text-neutral-400 uppercase mb-1">
              Time Remaining
            </div>
            <Countdown target={nextSession.scheduledStartTime} label="Session starts in" variant="compact" />
          </div>
        </div>
      )}

      {/* Navigation Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Discover */}
        <Link
          href="/student/discover"
          className="apple-card p-6 bg-white border border-black/[0.06] hover:border-blue-400 hover:shadow-md transition group flex flex-col justify-between"
        >
          <div>
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 w-fit mb-4 group-hover:scale-105 transition">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-neutral-900 group-hover:text-blue-600 transition">
              Discover Verified Alumni
            </h3>
            <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
              Explore multi-factor algorithm matches based on your skills, target roles, and preferred industries.
            </p>
          </div>
          <div className="text-xs font-semibold text-blue-600 flex items-center gap-1 mt-6">
            <span>Explore Recommendations</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </div>
        </Link>

        {/* Card 2: Requests */}
        <Link
          href="/student/requests"
          className="apple-card p-6 bg-white border border-black/[0.06] hover:border-emerald-400 hover:shadow-md transition group flex flex-col justify-between"
        >
          <div>
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 w-fit mb-4 group-hover:scale-105 transition">
              <Send className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-neutral-900 group-hover:text-emerald-600 transition">
              Track Outgoing Requests
            </h3>
            <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
              Monitor request statuses and check your remaining rolling 7-day request quota.
            </p>
          </div>
          <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1 mt-6">
            <span>View Sent Requests ({pendingRequestsCount} Pending)</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </div>
        </Link>

        {/* Card 3: Workspaces */}
        <Link
          href="/student/mentorships"
          className="apple-card p-6 bg-white border border-black/[0.06] hover:border-purple-400 hover:shadow-md transition group flex flex-col justify-between"
        >
          <div>
            <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 w-fit mb-4 group-hover:scale-105 transition">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-neutral-900 group-hover:text-purple-600 transition">
              Active Mentorships
            </h3>
            <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
              Enter your collaborative workspace with accepted mentors: video sessions, goals, and chat.
            </p>
          </div>
          <div className="text-xs font-semibold text-purple-600 flex items-center gap-1 mt-6">
            <span>Open Workspaces ({mentorships.length} Active)</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </div>
        </Link>

        {/* Card 4: Profile */}
        <Link
          href="/student/profile"
          className="apple-card p-6 bg-white border border-black/[0.06] hover:border-amber-400 hover:shadow-md transition group flex flex-col justify-between"
        >
          <div>
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 w-fit mb-4 group-hover:scale-105 transition">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-neutral-900 group-hover:text-amber-600 transition">
              Career & Skills Profile
            </h3>
            <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
              Update your target roles, industry interests, and technical skills to refine recommendation quality.
            </p>
          </div>
          <div className="text-xs font-semibold text-amber-600 flex items-center gap-1 mt-6">
            <span>Manage Profile ({completionScore}%)</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
          </div>
        </Link>
      </div>
    </div>
  );
}
