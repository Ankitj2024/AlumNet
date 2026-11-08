'use client';

import React, { useState, useEffect } from 'react';
import { Briefcase, CheckCircle2, Save, Zap, Building, Award } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { Breadcrumb } from '@/components/arc/breadcrumb/breadcrumb';
import { Button } from '@/components/arc/button/button';

export default function MentorProfilePage() {
  const [designation, setDesignation] = useState('Senior Cloud Architect');
  const [org, setOrg] = useState('Amazon Web Services');
  const [industry, setIndustry] = useState('Cloud Infrastructure');
  const [years, setYears] = useState('6');
  const [summary, setSummary] = useState(
    'Passionate about guiding computer science undergraduates in cloud architecture, distributed systems, and real-world system design interviews.'
  );
  const [skills, setSkills] = useState('Distributed Systems, Cloud Architecture, Go, Kubernetes');
  const [topics, setTopics] = useState('System Design Interviews, Cloud Certifications, Career Transitions');
  const [maxCapacity, setMaxCapacity] = useState('3');

  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const [profRes, capRes] = await Promise.all([
        fetchApi<any>('/alumni/profile/me'),
        fetchApi<any>('/alumni/capacity/me'),
      ]);

      if (profRes.success && profRes.data) {
        if (profRes.data.professionalDesignation) setDesignation(profRes.data.professionalDesignation);
        if (profRes.data.organisation) setOrg(profRes.data.organisation);
        if (profRes.data.industry) setIndustry(profRes.data.industry);
        if (profRes.data.yearsOfExperience) setYears(String(profRes.data.yearsOfExperience));
        if (profRes.data.professionalSummary) setSummary(profRes.data.professionalSummary);
        if (profRes.data.expertiseTags?.length) setSkills(profRes.data.expertiseTags.join(', '));
        if (profRes.data.mentoringTopics?.length) setTopics(profRes.data.mentoringTopics.join(', '));
      }

      if (capRes.success && capRes.data) {
        if (capRes.data.maxActiveMentees) setMaxCapacity(String(capRes.data.maxActiveMentees));
      }
    }

    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setToastMessage(null);

    const [profRes, capRes] = await Promise.all([
      fetchApi<any>('/alumni/profile/me', {
        method: 'PUT',
        body: JSON.stringify({
          professionalDesignation: designation,
          organisation: org,
          industry,
          yearsOfExperience: Number(years),
          professionalSummary: summary,
          expertiseTags: skills.split(',').map((s) => s.trim()).filter(Boolean),
          mentoringTopics: topics.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      }),
      fetchApi<any>('/alumni/capacity/me', {
        method: 'PUT',
        body: JSON.stringify({
          maxActiveMentees: Number(maxCapacity),
        }),
      }),
    ]);

    setSaving(false);

    if (profRes.success && capRes.success) {
      setToastMessage('Professional profile and capacity configuration updated successfully!');
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/[0.06]">
        <div>
          <Breadcrumb
            items={[
              { label: 'Campus' },
              { label: 'Mentor Portal' },
              { label: 'Profile & Capacity' },
            ]}
          />
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mt-2">
            Professional Profile & Mentoring Capacity
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Set capacity limits to protect your professional bandwidth and update expertise tags for matching.
          </p>
        </div>

        <div className="apple-card px-4 py-2 bg-white flex items-center gap-2 border border-black/[0.06]">
          <Zap className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-neutral-900">Cap: {maxCapacity} Mentees</span>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="apple-card p-6 bg-white border border-black/[0.06] space-y-4">
        {/* Capacity Slider / Selector */}
        <div className="p-4 rounded-2xl bg-[#f5f5f7] border border-black/[0.04] space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-600" />
              Maximum Active Mentee Capacity (Invariant: 1 to 10)
            </label>
            <span className="text-base font-bold text-emerald-700">{maxCapacity} Mentees</span>
          </div>
          <p className="text-[11px] text-neutral-500">
            Once you reach this number of active mentees, inbound requests are paused automatically to protect your professional capacity.
          </p>
          <input
            type="range"
            min="1"
            max="10"
            value={maxCapacity}
            onChange={(e) => setMaxCapacity(e.target.value)}
            className="w-full accent-emerald-600 cursor-pointer"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Current Professional Role / Designation
            </label>
            <input
              type="text"
              required
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Organisation / Employer
            </label>
            <input
              type="text"
              required
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Primary Industry
            </label>
            <input
              type="text"
              required
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Years of Experience
            </label>
            <input
              type="number"
              required
              min="1"
              value={years}
              onChange={(e) => setYears(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1">
            Professional Bio / Mentorship Philosophy
          </label>
          <textarea
            required
            rows={3}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full text-xs p-3 rounded-xl border border-neutral-200"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1">
            Technical Expertise Tags (comma separated)
          </label>
          <input
            type="text"
            required
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200"
          />
          <span className="text-[10px] text-neutral-400 mt-0.5 block">
            Used by the matching algorithm to match you with students developing these skills.
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1">
            Mentoring Topics & Discussions (comma separated)
          </label>
          <input
            type="text"
            required
            value={topics}
            onChange={(e) => setTopics(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={saving}
            className="rounded-full px-6 font-semibold text-xs"
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
