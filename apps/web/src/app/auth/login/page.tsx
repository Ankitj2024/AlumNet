'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  GraduationCap,
  Building2,
  Users,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/arc/button/button';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const { login, getDashboardRouteForRole } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const executeLogin = async (loginEmail: string, loginPass: string) => {
    setError(null);
    setLoading(true);

    const res = await login(loginEmail, loginPass);
    setLoading(false);
    setActiveDemo(null);

    if (!res.success || !res.user) {
      setError(res.error || 'Authentication failed. Please check credentials.');
      return;
    }

    // Determine target route
    const targetRoute = redirectUrl || getDashboardRouteForRole(res.user.role);
    router.push(targetRoute);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeLogin(email, password);
  };

  const handleInstantDemoLogin = async (demoEmail: string, demoRole: string) => {
    setActiveDemo(demoRole);
    setEmail(demoEmail);
    setPassword('DemoPassword123!');
    await executeLogin(demoEmail, 'DemoPassword123!');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#f5f5f7]">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center mx-auto shadow-md font-bold text-base mb-3">
            P11
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
            Institutional Gateway
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Verified Alumni Mentorship Matching & Engagement Platform
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/60 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Demo Fast Login Station */}
        <div className="apple-card p-5 bg-white border border-black/[0.06] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              1-Click Demo Login Station
            </div>
            <span className="text-[10px] text-neutral-400 font-medium">Pre-authenticated</span>
          </div>
          <p className="text-[11px] text-neutral-500 mb-3">
            Click any institutional role below to instantly authenticate and navigate into that dedicated portal:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Student Demo */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleInstantDemoLogin('student.demo@university.edu', 'Student')}
              className="p-3 rounded-xl border border-neutral-200/80 bg-neutral-50/60 hover:bg-neutral-100 hover:border-blue-300 text-left transition flex items-start gap-2.5 group"
            >
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0 group-hover:scale-105 transition">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-xs text-neutral-900 flex items-center justify-between">
                  <span>Student Portal</span>
                  <ArrowRight className="w-3 h-3 text-neutral-400 group-hover:translate-x-0.5 transition" />
                </div>
                <div className="text-[10px] text-neutral-400 truncate">student.demo@university.edu</div>
                <div className="text-[9px] text-blue-600 font-medium mt-0.5">Routes to /student</div>
              </div>
            </button>

            {/* Mentor Demo */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleInstantDemoLogin('mentor.demo@alumni.edu', 'Mentor')}
              className="p-3 rounded-xl border border-neutral-200/80 bg-neutral-50/60 hover:bg-neutral-100 hover:border-emerald-300 text-left transition flex items-start gap-2.5 group"
            >
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0 group-hover:scale-105 transition">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-xs text-neutral-900 flex items-center justify-between">
                  <span>Alumni Mentor</span>
                  <ArrowRight className="w-3 h-3 text-neutral-400 group-hover:translate-x-0.5 transition" />
                </div>
                <div className="text-[10px] text-neutral-400 truncate">mentor.demo@alumni.edu</div>
                <div className="text-[9px] text-emerald-600 font-medium mt-0.5">Routes to /mentor</div>
              </div>
            </button>

            {/* Officer Demo */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleInstantDemoLogin('officer.demo@university.edu', 'Officer')}
              className="p-3 rounded-xl border border-neutral-200/80 bg-neutral-50/60 hover:bg-neutral-100 hover:border-amber-300 text-left transition flex items-start gap-2.5 group"
            >
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600 shrink-0 group-hover:scale-105 transition">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-xs text-neutral-900 flex items-center justify-between">
                  <span>Relations Officer</span>
                  <ArrowRight className="w-3 h-3 text-neutral-400 group-hover:translate-x-0.5 transition" />
                </div>
                <div className="text-[10px] text-neutral-400 truncate">officer.demo@university.edu</div>
                <div className="text-[9px] text-amber-600 font-medium mt-0.5">Routes to /officer</div>
              </div>
            </button>

            {/* Admin Demo */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleInstantDemoLogin('admin.demo@university.edu', 'Admin')}
              className="p-3 rounded-xl border border-neutral-200/80 bg-neutral-50/60 hover:bg-neutral-100 hover:border-purple-300 text-left transition flex items-start gap-2.5 group"
            >
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600 shrink-0 group-hover:scale-105 transition">
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-xs text-neutral-900 flex items-center justify-between">
                  <span>Super Admin</span>
                  <ArrowRight className="w-3 h-3 text-neutral-400 group-hover:translate-x-0.5 transition" />
                </div>
                <div className="text-[10px] text-neutral-400 truncate">admin.demo@university.edu</div>
                <div className="text-[9px] text-purple-600 font-medium mt-0.5">Routes to /officer</div>
              </div>
            </button>
          </div>
        </div>

        {/* Manual Login Form */}
        <form onSubmit={handleManualSubmit} className="apple-card p-6 bg-white space-y-4 border border-black/[0.06]">
          <div className="text-xs font-semibold text-neutral-700 mb-1">Or Sign In Manually</div>

          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">
              Institutional Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.edu"
                className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={loading}
            className="w-full rounded-full mt-2"
          >
            {loading ? (activeDemo ? `Authenticating ${activeDemo}...` : 'Verifying credentials...') : 'Sign In'}
          </Button>

          <div className="pt-2 text-center text-xs text-neutral-400">
            Need an institutional account?{' '}
            <Link href="/auth/register" className="text-blue-600 font-semibold hover:underline">
              Register here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center text-xs text-neutral-400">
          Loading institutional gateway...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
