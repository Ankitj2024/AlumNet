'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, getDashboardRouteForRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-black rounded-full animate-spin mb-3" />
        <p className="text-xs text-neutral-500 font-medium">Validating institutional session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    const safeRoute = getDashboardRouteForRole(user.role);
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 border border-amber-200/60 shadow-sm">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-neutral-900 mb-1">Access Restricted (403)</h2>
        <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
          Your institutional role <span className="font-semibold text-neutral-800">({user.role})</span> does
          not have authorization to view this workspace.
        </p>
        <Link
          href={safeRoute}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-neutral-900 text-white hover:bg-black transition shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Return to Permitted Portal
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

