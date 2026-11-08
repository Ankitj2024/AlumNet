'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Zap,
  Lock,
  Target,
  BarChart3,
  Users,
  ChevronRight,
  GraduationCap,
  Briefcase,
  Building2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { MetricCard } from '@/components/arc/metric-card/metric-card';
import { Button } from '@/components/arc/button/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/arc/tabs/tabs';
import { Sparkline } from '@/components/arc/sparkline/sparkline';

export default function HomePage() {
  const engagementTrend = [12, 19, 28, 35, 52, 68, 85, 112, 142];

  return (
    <div className="flex flex-col bg-[#f5f5f7] min-h-screen">
      {/* Apple Minimalist Hero */}
      <section className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-black/[0.06] shadow-xs text-xs font-medium text-neutral-600 mb-6 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          University Mentorship Ecosystem
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-neutral-900 leading-[1.08] mb-6">
          Verified alumni. <br />
          <span className="text-neutral-400 font-semibold">Structured outcomes.</span>
        </h1>

        <p className="text-lg sm:text-xl text-neutral-500 max-w-2xl mx-auto mb-10 font-normal leading-relaxed">
          Connect with verified university graduates through capacity-protected, privacy-guaranteed mentorship. Designed for students, trusted by alumni.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-16">
          <Link href="/auth/login">
            <Button size="lg" variant="primary" className="rounded-full px-7 shadow-sm">
              Sign In with Institutional ID
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button size="lg" variant="secondary" className="rounded-full px-7">
              Launch 1-Click Demo Accounts &rarr;
            </Button>
          </Link>
        </div>

        {/* Live Metrics Grid using @uiarc MetricCard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          <MetricCard
            label="Verified Alumni"
            value={100}
            suffix="%"
            context="Registrar database confirmed"
            change="+100%"
          />
          <MetricCard
            label="Capacity Invariant"
            value={10}
            suffix=" Max"
            context="Zero over-allocation breaches"
            change="Atomic"
          />
          <MetricCard
            label="Privacy Leakage"
            value={0}
            suffix=" PII"
            context="Strict allowlisted DTOs"
            change="Zero-Leak"
          />
          <MetricCard
            label="Placement Correlation"
            value={88}
            suffix="%"
            context="Career goal conversion rate"
            change="+42%"
          />
        </div>
      </section>

      {/* Interactive Tabs Section using @uiarc/tabs */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
            Tailored for every stakeholder
          </h2>
          <p className="text-sm text-neutral-500 mt-2">
            Switch between portals to experience the platform workflows.
          </p>
        </div>

        <Tabs defaultValue="students" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList>
              <TabsTrigger value="students">For Students</TabsTrigger>
              <TabsTrigger value="alumni">For Alumni Mentors</TabsTrigger>
              <TabsTrigger value="officers">For University Officers</TabsTrigger>
            </TabsList>
          </div>

          {/* Student Tab */}
          <TabsContent value="students">
            <div className="apple-card p-8 sm:p-10 bg-white grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-3">
                  Targeted discovery without cold outreach
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed mb-6">
                  Build your career profile and let our multi-factor engine recommend verified alumni with transparent overlap reasons in expertise, roles, and industry.
                </p>
                <ul className="space-y-2.5 text-xs text-neutral-600 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Explainable match cards detailing exact skill overlap
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Structured scheduling with calendar synchronization
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Collaborative goal tracking and action checklist
                  </li>
                </ul>
                <Link href="/student">
                  <Button variant="primary" size="sm" className="rounded-full">
                    Open Student Portal &rarr;
                  </Button>
                </Link>
              </div>

              <div className="bg-[#f5f5f7] p-6 rounded-2xl border border-black/[0.04] space-y-3">
                <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  Sample Explainable Recommendation
                </div>
                <div className="p-4 bg-white rounded-xl shadow-xs border border-black/[0.04]">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold text-sm text-neutral-900">Sarah Connor</div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                      94% Match
                    </span>
                  </div>
                  <div className="text-xs text-neutral-500">
                    Senior Cloud Architect at Amazon Web Services
                  </div>
                  <div className="mt-3 pt-3 border-t border-neutral-100 flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 bg-neutral-100 rounded text-[10px] text-neutral-600">
                      Distributed Systems (Match)
                    </span>
                    <span className="px-2 py-0.5 bg-neutral-100 rounded text-[10px] text-neutral-600">
                      Cloud Architecture (Match)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Alumni Tab */}
          <TabsContent value="alumni">
            <div className="apple-card p-8 sm:p-10 bg-white grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-3">
                  Zero burnout. Absolute capacity control.
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed mb-6">
                  Set your maximum mentee limit (1 to 10). Backend atomic invariant checks ensure you will never receive requests beyond your chosen capacity.
                </p>
                <ul className="space-y-2.5 text-xs text-neutral-600 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    One-click decline with zero penalty to mentor rating
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Direct email and phone never leaked to students
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    One-click pause and resume mentoring toggle
                  </li>
                </ul>
                <Link href="/mentor">
                  <Button variant="primary" size="sm" className="rounded-full">
                    Open Mentor Workspace &rarr;
                  </Button>
                </Link>
              </div>

              <div className="bg-[#f5f5f7] p-6 rounded-2xl border border-black/[0.04] space-y-4">
                <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Capacity Protection Status
                </div>
                <div className="p-4 bg-white rounded-xl shadow-xs border border-black/[0.04]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-neutral-700">Active Mentee Load</span>
                    <span className="text-xs font-bold text-emerald-600">2 / 3 Active</span>
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-2 rounded-full w-2/3" />
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-2">
                    1 slot remaining • Accepting incoming requests
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Officer Tab */}
          <TabsContent value="officers">
            <div className="apple-card p-8 sm:p-10 bg-white grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-3">
                  Institutional visibility & verification
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed mb-6">
                  Maintain trust through 3-source alumni verification, track mentor utilization to prevent overload, and export placement outcome correlations.
                </p>
                <ul className="space-y-2.5 text-xs text-neutral-600 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Registrar ERP auto-match & batch CSV imports
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Real-time engagement health evaluator
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Full audit history on all approvals and role changes
                  </li>
                </ul>
                <Link href="/officer">
                  <Button variant="primary" size="sm" className="rounded-full">
                    Open Officer Queue &rarr;
                  </Button>
                </Link>
              </div>

              <div className="bg-[#f5f5f7] p-6 rounded-2xl border border-black/[0.04]">
                <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  Weekly Mentorship Activity Trend
                </div>
                <div className="h-32 flex items-center justify-center">
                  <Sparkline label="Weekly Mentorship Sessions" data={engagementTrend} />
                </div>
                <div className="text-center text-[11px] text-neutral-400 mt-2">
                  Completed sessions growing +34% month-over-month
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Five Product Principles - Minimalist Apple Cards */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
            Engineered with non-negotiable principles
          </h2>
          <p className="text-sm text-neutral-500 mt-2">
            Production-grade architecture designed for institutional deployment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="apple-card p-6 bg-white">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900 mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-neutral-900 mb-2">1. Verified Identity</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Every alumnus is verified via university registrar records before becoming discoverable. Unverified accounts cannot mentor.
            </p>
          </div>

          <div className="apple-card p-6 bg-white">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900 mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-neutral-900 mb-2">2. Capacity Protection</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Capacity is an unbreakable atomic invariant. Concurrent requests never exceed the mentor's maximum active threshold.
            </p>
          </div>

          <div className="apple-card p-6 bg-white">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900 mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-neutral-900 mb-2">3. Zero Contact Leakage</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Alumni direct email and phone numbers are never returned in student responses. Messages and sessions occur securely in-platform.
            </p>
          </div>

          <div className="apple-card p-6 bg-white">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900 mb-4">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-neutral-900 mb-2">4. Explainable Matching</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Transparent 5-factor scoring engine: expertise (40%), career role (20%), industry (15%), interests (10%), and availability (15%).
            </p>
          </div>

          <div className="apple-card p-6 bg-white">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900 mb-4">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-neutral-900 mb-2">5. Measurable Outcomes</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Action items, completed sessions, and 2-way feedback aggregate directly into placement department career readiness analytics.
            </p>
          </div>

          <div className="apple-card p-6 bg-white">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900 mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-neutral-900 mb-2">RBAC Governance</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Strict role-based access control protecting student privacy, alumni capacity, and institutional administrative records.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
