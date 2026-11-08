'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, GraduationCap, Briefcase, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/arc/button/button';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<'STUDENT' | 'ALUMNI_MENTOR'>('STUDENT');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetchApi<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        firstName,
        lastName,
        role,
      }),
    });

    setLoading(false);

    if (!res.success) {
      setError(res.error?.message || 'Registration failed. Check password requirements.');
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }

    if (role === 'ALUMNI_MENTOR') {
      router.push('/mentor');
    } else {
      router.push('/student');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-[#f5f5f7]">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center mx-auto shadow-md font-bold text-sm mb-3">
            P11
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
            Create Institutional Account
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Select your role to activate verification
          </p>
        </div>

        {/* Apple Segmented Role Control */}
        <div className="p-1 rounded-full bg-neutral-200/70 grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setRole('STUDENT')}
            className={`py-1.5 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              role === 'STUDENT'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
            Enrolled Student
          </button>

          <button
            type="button"
            onClick={() => setRole('ALUMNI_MENTOR')}
            className={`py-1.5 px-3 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              role === 'ALUMNI_MENTOR'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
            Alumni Professional
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/60 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="apple-card p-7 sm:p-8 bg-white space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">
                First Name
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">
                Last Name
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

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
              Password (Min 8 chars, 1 uppercase, 1 special, 1 number)
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
            {loading ? 'Creating Account...' : `Register as ${role === 'STUDENT' ? 'Student' : 'Alumnus'}`}
          </Button>

          <div className="pt-2 text-center text-xs text-neutral-400">
            Already registered?{' '}
            <Link href="/auth/login" className="text-blue-600 font-semibold hover:underline">
              Sign In here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
