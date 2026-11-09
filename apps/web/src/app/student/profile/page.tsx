'use client';

import React, { useState, useEffect } from 'react';
import { Target, CheckCircle2, Save, GraduationCap, Briefcase, Award } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { Breadcrumb } from '@/components/arc/breadcrumb/breadcrumb';
import { Button } from '@/components/arc/button/button';
import { Gauge } from '@/components/arc/gauge/gauge';

export default function StudentProfilePage() {
  const [programme, setProgramme] = useState('B.Tech');
  const [department, setDepartment] = useState('Computer Science');
  const [gradYear, setGradYear] = useState('2026');
  const [studentId, setStudentId] = useState('STU-2024-CS-019');
  const [skills, setSkills] = useState('TypeScript, React, MongoDB, Node.js');
  const [targetRoles, setTargetRoles] = useState('Full Stack Engineer, Cloud Developer');
  const [industries, setIndustries] = useState('FinTech, Cloud Infrastructure');

  const [completionScore, setCompletionScore] = useState(20);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const res = await fetchApi<any>('/students/profile/me');
      if (res.success && res.data) {
        if (res.data.academicProgramme) setProgramme(res.data.academicProgramme);
        if (res.data.department) setDepartment(res.data.department);
        if (res.data.expectedGraduationYear) setGradYear(String(res.data.expectedGraduationYear));
        if (res.data.institutionalStudentId) setStudentId(res.data.institutionalStudentId);
        if (res.data.skills?.length) setSkills(res.data.skills.join(', '));
        if (res.data.targetJobRoles?.length) setTargetRoles(res.data.targetJobRoles.join(', '));
        if (res.data.preferredIndustries?.length) setIndustries(res.data.preferredIndustries.join(', '));
        if (res.data.profileCompletionScore) setCompletionScore(res.data.profileCompletionScore);
      }
    }

    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setToastMessage(null);

    const res = await fetchApi<any>('/students/profile/me', {
      method: 'PUT',
      body: JSON.stringify({
        institutionalStudentId: studentId,
        academicProgramme: programme,
        department,
        expectedGraduationYear: Number(gradYear),
        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        targetJobRoles: targetRoles.split(',').map((s) => s.trim()).filter(Boolean),
        preferredIndustries: industries.split(',').map((s) => s.trim()).filter(Boolean),
      }),
    });

    setSaving(false);

    if (res.success && res.data) {
      setCompletionScore(res.data.profileCompletionScore || 85);
      setToastMessage('Career profile updated successfully! Recommendations have been recalibrated.');
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
              { label: 'Student Portal' },
              { label: 'Career Profile' },
            ]}
          />
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mt-2">
            Academic & Career Profile
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Keep your skills and target industries up to date to ensure high recommendation accuracy.
          </p>
        </div>

        <div className="apple-card px-4 py-3 bg-white flex items-center gap-3 border border-black/[0.06]">
          <div className="w-10 h-10 flex items-center justify-center">
            <Gauge label="Readiness" value={completionScore} min={0} max={100} />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-neutral-400 uppercase">Readiness</div>
            <div className="text-base font-bold text-neutral-900">{completionScore}%</div>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="apple-card p-6 bg-white border border-black/[0.06] space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Institutional Student ID
            </label>
            <input
              type="text"
              required
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Academic Programme / Degree
            </label>
            <input
              type="text"
              required
              value={programme}
              onChange={(e) => setProgramme(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Department
            </label>
            <input
              type="text"
              required
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Expected Graduation Year
            </label>
            <input
              type="number"
              required
              value={gradYear}
              onChange={(e) => setGradYear(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1">
            Technical & Professional Skills (comma separated)
          </label>
          <input
            type="text"
            required
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200"
          />
          <span className="text-[10px] text-neutral-400 mt-0.5 block">
            Used by the matching engine to compute technical expertise overlap.
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1">
            Target Job Roles (comma separated)
          </label>
          <input
            type="text"
            required
            value={targetRoles}
            onChange={(e) => setTargetRoles(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200"
          />
          <span className="text-[10px] text-neutral-400 mt-0.5 block">
            Matches against alumni mentors’ current professional designations.
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1">
            Preferred Industries (comma separated)
          </label>
          <input
            type="text"
            required
            value={industries}
            onChange={(e) => setIndustries(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200"
          />
          <span className="text-[10px] text-neutral-400 mt-0.5 block">
            e.g. Cloud Infrastructure, FinTech, Autonomous Vehicles, Healthcare AI.
          </span>
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
            {saving ? 'Updating...' : 'Save Profile'}
          </Button>
        </div>
      </form>
    </div>
  );
}

