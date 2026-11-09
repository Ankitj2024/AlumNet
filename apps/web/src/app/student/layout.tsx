'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  LayoutDashboard,
  Compass,
  Send,
  Users,
  Target,
  GraduationCap,
} from 'lucide-react';

interface StudentLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: '/student', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/student/discover', label: 'Discover Mentors', icon: Compass },
  { href: '/student/requests', label: 'Track Requests', icon: Send },
  { href: '/student/mentorships', label: 'Active Workspaces', icon: Users },
  { href: '/student/profile', label: 'Career Profile', icon: Target },
];

export default function StudentLayout({ children }: StudentLayoutProps) {
  const pathname = usePathname();

  const isActive = (item: typeof navItems[0]) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  return (
    <ProtectedRoute allowedRoles={['STUDENT', 'SUPER_ADMIN']}>
      <div className="min-h-screen bg-[#f5f5f7]">
        {/* Sub-navigation bar for Student Portal */}
        <div className="bg-white border-b border-black/[0.06] sticky top-14 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-12">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <span className="font-semibold text-xs text-neutral-900 tracking-tight hidden sm:inline">
                  Student Career Portal
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

