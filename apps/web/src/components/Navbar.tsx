'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  GraduationCap,
  ShieldCheck,
  Building2,
  LogOut,
  Sparkles,
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch (e) {}
      }
    }
  }, [pathname]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/75 border-b border-black/[0.06] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-semibold text-sm shadow-sm group-hover:scale-105 transition-transform duration-200">
              P11
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-tight text-neutral-900 leading-none">
                Alumni Mentorship
              </span>
              <span className="text-[10px] text-neutral-400 font-medium tracking-wide mt-0.5">
                Institutional Ecosystem
              </span>
            </div>
          </Link>

          {/* Navigation Segment Control */}
          <nav className="hidden md:flex items-center p-1 rounded-full bg-neutral-100/90 border border-neutral-200/60 shadow-inner">
            <Link
              href="/"
              className={`px-3.5 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                pathname === '/'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Overview
            </Link>

            <Link
              href="/student"
              className={`px-3.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all duration-200 ${
                pathname.startsWith('/student')
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
              Student
            </Link>

            <Link
              href="/mentor"
              className={`px-3.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all duration-200 ${
                pathname.startsWith('/mentor')
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Mentor
            </Link>

            <Link
              href="/officer"
              className={`px-3.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all duration-200 ${
                pathname.startsWith('/officer')
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              Officer Queue
            </Link>
          </nav>

          {/* User Status / Auth Actions */}
          <div className="flex items-center gap-2.5">
            {currentUser ? (
              <div className="flex items-center gap-2 bg-neutral-100/80 pl-2.5 pr-1.5 py-1 rounded-full border border-neutral-200/60">
                <span className="text-[11px] font-medium text-neutral-700">
                  {currentUser.firstName}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-neutral-500 font-medium shadow-xs">
                  {currentUser.role === 'ALUMNI_MENTOR'
                    ? 'Mentor'
                    : currentUser.role === 'ALUMNI_RELATIONS_OFFICER'
                    ? 'Officer'
                    : 'Student'}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-1 rounded-full hover:bg-neutral-200 text-neutral-400 hover:text-neutral-700 transition"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="text-xs font-medium text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded-full hover:bg-neutral-100 transition"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/register"
                  className="text-xs font-medium bg-neutral-900 hover:bg-black text-white px-3.5 py-1.5 rounded-full shadow-sm hover:shadow transition"
                >
                  Get started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
