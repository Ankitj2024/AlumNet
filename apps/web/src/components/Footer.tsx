import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, University } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#f5f5f7] border-t border-black/[0.06] text-neutral-500 text-xs py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-black/[0.04] pb-6 mb-6">
          <div className="flex items-center gap-2 text-neutral-900 font-semibold">
            <div className="w-5 h-5 rounded-md bg-black text-white flex items-center justify-center text-[10px] font-bold">
              P11
            </div>
            Verified Alumni Mentorship Platform
          </div>

          <div className="flex flex-wrap items-center gap-6 text-[11px] text-neutral-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Registrar Authenticated
            </span>
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-blue-600" /> Zero Contact Leakage
            </span>
            <span>SF Pro Typography</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-400 gap-2">
          <p>© 2026 P11 Institutional Mentorship Platform. All rights reserved.</p>
          <div className="flex gap-4">
            <span>University Enterprise System</span>
            <span>•</span>
            <span>Track J Complete Release</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
