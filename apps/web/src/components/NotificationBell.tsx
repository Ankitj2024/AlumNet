'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  HeartHandshake,
  AlertCircle,
  ExternalLink,
  Settings,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface AppNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata?: any;
}

export function NotificationBell() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetchApi<{ notifications: AppNotification[]; unreadCount: number }>(
        '/notifications?limit=15'
      );
      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {
      // Silently fall back if disconnected
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [user]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetchApi(`/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Silently ignore
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetchApi('/notifications/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Silently ignore
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'REQUEST_ACCEPTED':
      case 'VERIFICATION_RESULT':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'SESSION_CONFIRMED':
      case 'SESSION_REMINDER':
      case 'SESSION_PROPOSED':
        return <Calendar className="w-4 h-4 text-blue-500 shrink-0" />;
      case 'HEALTH_NUDGE':
        return <HeartHandshake className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'REQUEST_EXPIRED':
      case 'REQUEST_AUTO_CANCELLED':
      case 'REQUEST_DECLINED':
        return <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />;
      default:
        return <Bell className="w-4 h-4 text-neutral-500 shrink-0" />;
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition focus:outline-none"
        aria-label="Open notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-in zoom-in">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Container */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-black/[0.08] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-3.5 bg-neutral-50/80 border-b border-black/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs text-neutral-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-semibold text-[10px]">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="text-[11px] text-neutral-600 hover:text-neutral-900 font-medium flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
              <Link
                href="/settings/notifications"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-neutral-400 hover:text-neutral-700"
                title="Notification Preferences"
              >
                <Settings className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-black/[0.04]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400">
                No notifications right now.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => !notif.isRead && handleMarkAsRead(notif._id)}
                  className={`p-3.5 transition flex items-start gap-3 cursor-pointer ${
                    notif.isRead
                      ? 'bg-white opacity-70 hover:opacity-100'
                      : 'bg-blue-50/30 hover:bg-blue-50/60'
                  }`}
                >
                  <div className="mt-0.5">{getIconForType(notif.type)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-1">
                      <p className="text-xs font-semibold text-neutral-900 truncate">
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-neutral-400 whitespace-nowrap">
                        {new Date(notif.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-600 line-clamp-2 mt-0.5 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 self-center" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-neutral-50/60 border-t border-black/[0.06] text-center">
            <Link
              href="/settings/notifications"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-medium text-neutral-500 hover:text-neutral-900"
            >
              Configure notification preferences →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
