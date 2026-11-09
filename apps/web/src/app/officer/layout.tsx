'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  LayoutDashboard,
  ShieldCheck,
  FileSpreadsheet,
  Activity,
  Building2,
  Sliders,
  ShieldAlert,
  History,
} from 'lucide-react';

interface OfficerLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: '/officer', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/officer/verifications', label: 'Verification Queue', icon: ShieldCheck },
  { href: '/officer/moderation', label: 'Moderation Queue', icon: ShieldAlert },
  { href: '/officer/audit-logs', label: 'Audit Ledger', icon: History },
  { href: '/officer/registrar-sync', label: 'Registrar CSV Sync', icon: FileSpreadsheet },
  { href: '/officer/mentorships', label: 'Health Oversight', icon: Activity },
  { href: '/officer/policy', label: 'Programme Policy', icon: Sliders },
];

export default function OfficerLayout({ children }: OfficerLayoutProps) {
  const pathname = usePathname();

  const isActive = (item: typeof navItems[0]) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  return (
    <ProtectedRoute allowedRoles={['ALUMNI_RELATIONS_OFFICER', 'SUPER_ADMIN', 'PLACEMENT_OFFICER']}>
      <div className="min-h-screen bg-[#f5f5f7]">
        {/* Sub-navigation bar for Officer Portal */}
        <div className="bg-white border-b border-black/[0.06] sticky top-14 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-12">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="font-semibold text-xs text-neutral-900 tracking-tight hidden sm:inline">
                  Institutional Advancement & Oversight
                </span>
              </div>

              {/* Navigation Links */}
              <nav className="flex items-center gap-1 overflow-x-auto py-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition whitespace-nowrap ${
                        active
                          ? 'bg-neutral-900 text-white shadow-xs'
                          : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </div>
    </ProtectedRoute>
  );
}

