'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, FileText, Send, Building, Clock } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { Breadcrumb } from '@/components/arc/breadcrumb/breadcrumb';
import { Button } from '@/components/arc/button/button';

export default function MentorVerificationPage() {
  const [verification, setVerification] = useState<any>(null);
  const [alumniId, setAlumniId] = useState('ALUM-2022-CS-001');
  const [gradYear, setGradYear] = useState('2022');
  const [dept, setDept] = useState('Computer Science');
  const [degree, setDegree] = useState('B.Tech Computer Science');

  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVerification() {
      setLoading(true);
      const res = await fetchApi<any>('/alumni/verification/status');
      if (res.success && res.data) {
        setVerification(res.data);
        if (res.data.submittedAlumniId) setAlumniId(res.data.submittedAlumniId);
        if (res.data.graduationYear) setGradYear(String(res.data.graduationYear));
        if (res.data.academicDepartment) setDept(res.data.academicDepartment);
        if (res.data.degree) setDegree(res.data.degree);
      }
      setLoading(false);
    }

    loadVerification();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    const res = await fetchApi<any>('/alumni/verification/submit', {
      method: 'POST',
      body: JSON.stringify({
        submittedAlumniId: alumniId,
        graduationYear: Number(gradYear),
        academicDepartment: dept,
        degree,
      }),
    });

    setSubmitting(false);

    if (res.success && res.data) {
      setVerification(res.data);
      setToastMessage(
        res.data.status === 'VERIFIED'
          ? 'Automatic Verification Succeeded! Your credentials matched university registrar records.'
          : 'Verification submitted for Alumni Relations Officer review.'
      );
      setTimeout(() => setToastMessage(null), 5000);
    } else {
      setErrorMessage(res.error?.message || 'Verification submission failed.');
    }
  };

  const status = verification?.status || 'NOT_SUBMITTED';

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/[0.06]">
        <div>
          <Breadcrumb
            items={[
              { label: 'Campus' },
              { label: 'Mentor Portal' },
              { label: 'Identity Verification' },
            ]}
          />
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mt-2">
            Institutional Identity Verification
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Only verified alumni appear in student recommendation matches. Submissions are matched against Registrar ERP records.
          </p>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 self-start sm:self-auto ${
            status === 'VERIFIED'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
              : status === 'PENDING'
              ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
              : status === 'REJECTED'
              ? 'bg-rose-50 text-rose-800 border border-rose-200/60'
              : 'bg-neutral-100 text-neutral-700'
          }`}
        >
          Status: {status}
        </span>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/60 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Verification Status Card */}
      {status === 'VERIFIED' ? (
        <div className="apple-card p-6 bg-white border border-emerald-200/60 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-sm text-neutral-900">Your Identity is Confirmed & Verified</div>
              <div className="text-xs text-neutral-500">
                Method: {verification?.verificationMethod || 'INSTITUTIONAL_ERP_MATCH'}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#f5f5f7] text-xs space-y-1">
            <div className="text-neutral-700">
              • Verified Alumni ID: <span className="font-semibold">{verification?.submittedAlumniId}</span>
            </div>
            <div className="text-neutral-700">
              • Department & Class: <span className="font-semibold">{verification?.academicDepartment} (Class of {verification?.graduationYear})</span>
            </div>
            <div className="text-neutral-700">
              • Degree Awarded: <span className="font-semibold">{verification?.degree}</span>
            </div>
            {verification?.reviewNotes && (
              <div className="text-neutral-600 italic pt-1 border-t border-neutral-200 mt-2">
                Note: {verification.reviewNotes}
              </div>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="apple-card p-6 bg-white border border-black/[0.06] space-y-4">
          <div className="text-xs font-semibold text-neutral-800 mb-2">
            Submit Your Graduation Records for Verification
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Institutional Alumni / Enrollment ID
              </label>
              <input
                type="text"
                required
                value={alumniId}
                onChange={(e) => setAlumniId(e.target.value)}
                placeholder="e.g. ALUM-2022-CS-001"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200"
              />
              <span className="text-[10px] text-neutral-400 mt-0.5 block">
                Matches against Registrar ERP records.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Graduation Year
              </label>
              <input
                type="number"
                required
                value={gradYear}
                onChange={(e) => setGradYear(e.target.value)}
                placeholder="2022"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Academic Department
              </label>
              <input
                type="text"
                required
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                placeholder="Computer Science"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Degree Awarded
              </label>
              <input
                type="text"
                required
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                placeholder="B.Tech Computer Science"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#f5f5f7] text-[11px] text-neutral-500 flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              If your ID is found in the Registrar master database, verification is granted automatically. Otherwise, an Alumni Relations Officer reviews the submission.
            </span>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={submitting}
              className="rounded-full px-6 font-semibold text-xs"
            >
              <Send className="w-3.5 h-3.5 mr-1" />
              {submitting ? 'Verifying...' : 'Submit Verification'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

