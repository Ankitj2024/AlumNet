'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, ShieldCheck, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/arc/button/button';

interface NotificationPreferences {
  emailNotifications: boolean;
  inAppNotifications: boolean;
  sessionReminders: boolean;
  healthNudges: boolean;
}

export default function NotificationPreferencesPage() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    emailNotifications: true,
    inAppNotifications: true,
    sessionReminders: true,
    healthNudges: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadPrefs() {
      try {
        const res = await fetchApi<NotificationPreferences>('/notifications/preferences');
        if (res.success && res.data) {
          setPrefs(res.data);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load preferences');
      } finally {
        setLoading(false);
      }
    }
    loadPrefs();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg(false);
    setErrorMsg(null);

    try {
      const res = await fetchApi<NotificationPreferences>('/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify(prefs),
      });

      if (res.success && res.data) {
        setPrefs(res.data);
        setSavedMsg(true);
        setTimeout(() => setSavedMsg(false), 3000);
      } else {
        setErrorMsg('Failed to update preferences.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 transition font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Portal</span>
        </Link>

        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Notification Preferences
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Manage how and when you receive communications, schedule reminders, and institutional updates.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {savedMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Notification preferences updated successfully.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Channel Preferences */}
          <div className="apple-card p-6 bg-white space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Delivery Channels
            </h2>

            <div className="space-y-4">
              <label className="flex items-start justify-between gap-4 cursor-pointer">
                <div className="space-y-0.5">
                  <div className="font-semibold text-xs text-neutral-900 flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span>Email Communications</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Receive session invitations, reminder digests, and key updates at your institutional email.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.emailNotifications}
                  onChange={(e) => setPrefs({ ...prefs, emailNotifications: e.target.checked })}
                  className="w-4 h-4 mt-1 rounded text-black focus:ring-black"
                />
              </label>

              <label className="flex items-start justify-between gap-4 cursor-pointer">
                <div className="space-y-0.5">
                  <div className="font-semibold text-xs text-neutral-900 flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-purple-600" />
                    <span>In-App Realtime Alerts</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Receive instant banner and bell alerts when active on the platform.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.inAppNotifications}
                  onChange={(e) => setPrefs({ ...prefs, inAppNotifications: e.target.checked })}
                  className="w-4 h-4 mt-1 rounded text-black focus:ring-black"
                />
              </label>
            </div>
          </div>

          {/* Event-Level Triggers */}
          <div className="apple-card p-6 bg-white space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Activity & Reminder Preferences
            </h2>

            <div className="space-y-4">
              <label className="flex items-start justify-between gap-4 cursor-pointer">
                <div className="space-y-0.5">
                  <div className="font-semibold text-xs text-neutral-900 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>Session Reminders (24h & 1h prior)</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Timely alerts before confirmed mentorship sessions with direct video conference links.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.sessionReminders}
                  onChange={(e) => setPrefs({ ...prefs, sessionReminders: e.target.checked })}
                  className="w-4 h-4 mt-1 rounded text-black focus:ring-black"
                />
              </label>

              <label className="flex items-start justify-between gap-4 cursor-pointer">
                <div className="space-y-0.5">
                  <div className="font-semibold text-xs text-neutral-900 flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-amber-600" />
                    <span>Mentorship Health Nudges</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Gentle check-in prompts when mentorship relationships have been inactive for over 14 days.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.healthNudges}
                  onChange={(e) => setPrefs({ ...prefs, healthNudges: e.target.checked })}
                  className="w-4 h-4 mt-1 rounded text-black focus:ring-black"
                />
              </label>
            </div>
          </div>

          {/* Institutional Compliance Notice */}
          <div className="apple-card p-5 bg-neutral-100/70 border border-neutral-200/80 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-neutral-700 shrink-0 mt-0.5" />
            <div className="text-[11px] text-neutral-600 leading-relaxed">
              <span className="font-semibold text-neutral-900">Institutional Delivery Policy:</span>{' '}
              Mandatory transactional emails (such as account security notices, identity verification outcomes, request acceptances, and capacity closures) cannot be opted out of.
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-black disabled:opacity-50 transition"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
