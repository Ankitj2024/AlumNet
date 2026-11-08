'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/arc/button/button';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetchApi<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (!res.success) {
      setError(res.error?.message || 'Login failed. Please check credentials.');
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }

    const role = res.data.user.role;
    if (role === 'ALUMNI_MENTOR') {
      router.push('/mentor');
    } else if (role === 'ALUMNI_RELATIONS_OFFICER' || role === 'SUPER_ADMIN') {
      router.push('/officer');
    } else {
      router.push('/student');
    }
  };

  const handleDemoFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-[#f5f5f7]">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center">
          <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center mx-auto shadow-md font-bold text-sm mb-3">
            P11
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
            Sign in to Mentorship
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Institutional verification ecosystem
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/60 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="apple-card p-7 bg-white space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@university.edu"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={loading}
            className="w-full rounded-full mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </Button>

          <div className="pt-2 text-center text-xs text-neutral-400">
            Need an account?{' '}
            <Link href="/auth/register" className="text-blue-600 font-semibold hover:underline">
              Register here
            </Link>
          </div>
        </form>

        {/* Demo Fast Autofill Card */}
        <div className="apple-card p-4 bg-white/70">
          <div className="text-[11px] font-semibold text-neutral-500 mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            Demo One-Click Credentials:
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => handleDemoFill('student.demo@university.edu', 'DemoPassword123!')}
              className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200/70 text-left transition"
            >
              <div className="font-semibold text-blue-700 text-xs">Student</div>
              <div className="text-[9px] text-neutral-400 truncate">student.demo</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill('mentor.demo@alumni.edu', 'DemoPassword123!')}
              className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200/70 text-left transition"
            >
              <div className="font-semibold text-emerald-700 text-xs">Mentor</div>
              <div className="text-[9px] text-neutral-400 truncate">mentor.demo</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill('officer.demo@university.edu', 'DemoPassword123!')}
              className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200/70 text-left transition"
            >
              <div className="font-semibold text-amber-700 text-xs">Officer</div>
              <div className="text-[9px] text-neutral-400 truncate">officer.demo</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
