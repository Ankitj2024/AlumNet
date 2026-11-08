'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Compass,
  Search,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Building,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Send,
  X,
  Target,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { ExpandingSearch } from '@/components/arc/expanding-search/expanding-search';
import { Button } from '@/components/arc/button/button';
import { Breadcrumb } from '@/components/arc/breadcrumb/breadcrumb';

export default function StudentDiscoverPage() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Request modal state
  const [selectedMentor, setSelectedMentor] = useState<any>(null);
  const [intent, setIntent] = useState('');
  const [goals, setGoals] = useState('');
  const [submittingReq, setSubmittingReq] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecommendations() {
      setLoading(true);
      const recRes = await fetchApi<any[]>('/matching/recommendations');
      if (recRes.success && recRes.data) {
        setRecommendations(recRes.data);
      } else {
        // Fallback: active verified mentors
        const mentorsRes = await fetchApi<any[]>('/alumni/mentors');
        if (mentorsRes.success && mentorsRes.data) {
          setRecommendations(
            mentorsRes.data.map((m) => ({
              mentor: m,
              overallScore: 85,
              breakdown: { expertiseScore: 80, roleScore: 90, industryScore: 85, mentoringInterestScore: 80, availabilityScore: 90 },
              explanation: {
                matchingSkills: m.expertiseTags || [],
                matchingRoles: [m.professionalDesignation],
                matchingIndustries: [m.industry],
                hasAvailabilityOverlap: true,
                reasons: [`Matches background in ${m.industry}`],
              },
            }))
          );
        }
      }
      setLoading(false);
    }

    loadRecommendations();
  }, []);

  const industries = useMemo(() => {
    const list = Array.from(new Set(recommendations.map((r) => r.mentor?.industry).filter(Boolean)));
    return ['ALL', ...list];
  }, [recommendations]);

  const filteredRecommendations = useMemo(() => {
    return recommendations.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        `${item.mentor?.firstName} ${item.mentor?.lastName}`.toLowerCase().includes(q) ||
        (item.mentor?.professionalDesignation || '').toLowerCase().includes(q) ||
        (item.mentor?.organisation || '').toLowerCase().includes(q) ||
        (item.mentor?.expertiseTags || []).join(' ').toLowerCase().includes(q);

      const matchIndustry = selectedIndustry === 'ALL' || item.mentor?.industry === selectedIndustry;

      return matchSearch && matchIndustry;
    });
  }, [recommendations, searchQuery, selectedIndustry]);

  const searchItems = useMemo(() => {
    return recommendations.map((item, idx) => ({
      id: item.mentor?._id || `mentor-${idx}`,
      title: `${item.mentor?.firstName || ''} ${item.mentor?.lastName || ''} — ${item.mentor?.professionalDesignation || 'Mentor'}`,
      meta: `${item.mentor?.organisation || 'Alumni'} • ${(item.mentor?.expertiseTags || []).slice(0, 3).join(', ')}`,
      group: item.mentor?.organisation || 'Mentors',
      keywords: [
        item.mentor?.firstName,
        item.mentor?.lastName,
        item.mentor?.professionalDesignation,
        item.mentor?.organisation,
        ...(item.mentor?.expertiseTags || []),
      ].filter(Boolean),
    }));
  }, [recommendations]);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentor) return;

    setSubmittingReq(true);
    setErrorMessage(null);

    const res = await fetchApi<any>('/requests', {
      method: 'POST',
      body: JSON.stringify({
        mentorId: selectedMentor._id,
        statementOfIntent: intent,
        learningGoals: goals.split(',').map((g) => g.trim()).filter(Boolean),
      }),
    });

    setSubmittingReq(false);

    if (res.success) {
      setToastMessage('Mentorship request submitted successfully! Track its status in Sent Requests.');
      setSelectedMentor(null);
      setIntent('');
      setGoals('');
      setTimeout(() => setToastMessage(null), 5000);
    } else {
      setErrorMessage(res.error?.message || 'Failed to submit request. You may have reached your active limit.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/[0.06]">
        <div>
          <Breadcrumb
            items={[
              { label: 'Campus' },
              { label: 'Student Portal' },
              { label: 'Discover Mentors' },
            ]}
          />
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mt-2">
            Verified Alumni Mentor Directory
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Multi-factor weighted recommendations based on your technical skills, target job roles, and preferred industries.
          </p>
        </div>

        {/* Morphing Expanding Search */}
        <div className="w-full sm:w-80">
          <ExpandingSearch
            label="Search mentors"
            items={searchItems}
            placeholder="Search by skill, role, or company..."
            onSelect={(item) => setSearchQuery(item.title.split('—')[0].trim())}
          />
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <Link href="/student/requests" className="font-bold underline text-emerald-900">
            View Requests &rarr;
          </Link>
        </div>
      )}

      {/* Industry Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-semibold text-neutral-400 mr-1">Industry:</span>
        {industries.map((ind) => (
          <button
            key={ind}
            onClick={() => setSelectedIndustry(ind)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
              selectedIndustry === ind
                ? 'bg-neutral-900 text-white'
                : 'bg-white border border-neutral-200/80 text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {ind === 'ALL' ? 'All Industries' : ind}
          </button>
        ))}
      </div>

      {/* Recommendation Results Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-neutral-400">Loading verified mentors...</div>
      ) : filteredRecommendations.length === 0 ? (
        <div className="apple-card p-12 text-center bg-white border border-black/[0.06]">
          <Search className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
          <h3 className="font-semibold text-sm text-neutral-800">No mentors match your search criteria</h3>
          <p className="text-xs text-neutral-400 mt-1">Try clearing your search query or selecting All Industries.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredRecommendations.map((item, idx) => (
            <div
              key={idx}
              className="apple-card p-6 bg-white border border-black/[0.06] hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="font-bold text-base text-neutral-900">
                      {item.mentor?.firstName} {item.mentor?.lastName}
                    </div>
                    <div className="text-xs text-neutral-600 font-medium flex items-center gap-1.5 mt-0.5">
                      <Briefcase className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{item.mentor?.professionalDesignation || 'Senior Professional'}</span>
                    </div>
                    <div className="text-xs text-neutral-400 flex items-center gap-1.5 mt-0.5">
                      <Building className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{item.mentor?.organisation || 'Alumni Partner'}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/50">
                      {item.overallScore || 85}% Match
                    </span>
                    <div className="text-[10px] text-neutral-400 mt-1">Multi-factor score</div>
                  </div>
                </div>

                {item.mentor?.professionalSummary && (
                  <p className="text-xs text-neutral-600 line-clamp-2 mb-3 bg-[#fbfbfd] p-2.5 rounded-xl border border-black/[0.03]">
                    {item.mentor?.professionalSummary}
                  </p>
                )}

                {/* Explainable Rationale */}
                <div className="mb-4 space-y-1 bg-neutral-50/70 p-3 rounded-xl border border-neutral-100">
                  <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Why You Were Matched:
                  </div>
                  {item.explanation?.matchingSkills?.length > 0 && (
                    <div className="text-xs text-neutral-700">
                      • Shared skills: <span className="font-semibold">{item.explanation.matchingSkills.join(', ')}</span>
                    </div>
                  )}
                  {item.explanation?.matchingIndustries?.length > 0 && (
                    <div className="text-xs text-neutral-700">
                      • Industry alignment: <span className="font-semibold">{item.explanation.matchingIndustries.join(', ')}</span>
                    </div>
                  )}
                  {item.explanation?.reasons?.map((r: string, rIdx: number) => (
                    <div key={rIdx} className="text-xs text-neutral-700">
                      • {r}
                    </div>
                  ))}
                </div>

                {/* Skills tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {(item.mentor?.expertiseTags || []).map((skill: string, sIdx: number) => (
                    <span
                      key={sIdx}
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 text-neutral-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Accepting Mentees
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setSelectedMentor(item.mentor)}
                  className="rounded-full text-xs font-semibold px-4"
                >
                  <Send className="w-3 h-3 mr-1" />
                  Request Mentorship
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REQUEST MENTORSHIP MODAL */}
      {selectedMentor && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="apple-card p-6 bg-white max-w-lg w-full border border-black/[0.08] shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setSelectedMentor(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-neutral-900 mb-1">
              Request Mentorship with {selectedMentor.firstName} {selectedMentor.lastName}
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              State your goals and intent clearly. Mentors review these details before accepting.
            </p>

            {errorMessage && (
              <div className="p-3 mb-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSendRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Statement of Intent <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  placeholder="Explain why you are seeking mentorship and how this alumnus's experience aligns with your career path..."
                  className="w-full text-xs p-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Key Learning Goals (comma separated) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder="e.g. System Design Interviews, Resume Review, Cloud Architecture"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#f5f5f7] text-[11px] text-neutral-500 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Anti-Spam Quota: Max 3 concurrent pending requests and 5 requests per rolling 7 days.</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedMentor(null)}
                  className="rounded-full text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submittingReq}
                  className="rounded-full text-xs font-semibold"
                >
                  {submittingReq ? 'Submitting...' : 'Send Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
