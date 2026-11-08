'use client';

import React, { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import {
  GraduationCap,
  Target,
  Briefcase,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  Building,
  Tag,
  AlertCircle,
  Save,
  MessageSquare,
  Calendar,
  Send,
  Star,
  X,
  Check,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/arc/button/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/arc/tabs/tabs';
import { Breadcrumb } from '@/components/arc/breadcrumb/breadcrumb';
import { Gauge } from '@/components/arc/gauge/gauge';
import { ExpandingSearch } from '@/components/arc/expanding-search/expanding-search';
import { Countdown } from '@/components/arc/countdown/countdown';
import { ReorderableList } from '@/components/arc/reorderable-list/reorderable-list';

export default function StudentPortal() {
  const [activeTab, setActiveTab] = useState('discovery');
  const [profile, setProfile] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [mentorships, setMentorships] = useState<any[]>([]);
  const [selectedMentorship, setSelectedMentorship] = useState<any>(null);
  const [mentorshipDetails, setMentorshipDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Request Modal State
  const [selectedMentorForRequest, setSelectedMentorForRequest] = useState<any>(null);
  const [careerObjective, setCareerObjective] = useState('Prepare for Cloud Architect and System Design interviews.');
  const [requestMessage, setRequestMessage] = useState('Hello! I noticed your extensive background in distributed systems and would love guidance on preparing for technical engineering interviews.');
  const [preferredTopics, setPreferredTopics] = useState('System Design, Cloud Architecture');
  const [expectedOutcomes, setExpectedOutcomes] = useState('Gain clarity on production architectural trade-offs.');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Session Proposal State
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );
  const [sessionEndTime, setSessionEndTime] = useState(
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString().slice(0, 16)
  );
  const [sessionAgenda, setSessionAgenda] = useState('Resume deep dive and technical interview walkthrough.');

  // Messaging State
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [sendingMsg, setSendingMsg] = useState(false);

  // Feedback State
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [usefulness, setUsefulness] = useState(5);
  const [feedbackText, setFeedbackText] = useState('Incredibly actionable insights and advice.');

  // Profile Form states
  const [programme, setProgramme] = useState('');
  const [department, setDepartment] = useState('');
  const [gradYear, setGradYear] = useState(2026);
  const [studentId, setStudentId] = useState('');
  const [skills, setSkills] = useState('React, TypeScript, Node.js, MongoDB');
  const [targetRoles, setTargetRoles] = useState('Software Engineer, Full Stack Developer');
  const [industries, setIndustries] = useState('Cloud Infrastructure, FinTech');

  const loadData = async () => {
    setLoading(true);

    // Load student profile
    const profileRes = await fetchApi<any>('/students/profile/me');
    if (profileRes.success && profileRes.data) {
      setProfile(profileRes.data);
      setProgramme(profileRes.data.academicProgramme || '');
      setDepartment(profileRes.data.department || '');
      setGradYear(profileRes.data.expectedGraduationYear || 2026);
      setStudentId(profileRes.data.institutionalStudentId || '');
      if (profileRes.data.skills?.length) setSkills(profileRes.data.skills.join(', '));
      if (profileRes.data.targetJobRoles?.length) setTargetRoles(profileRes.data.targetJobRoles.join(', '));
      if (profileRes.data.preferredIndustries?.length) setIndustries(profileRes.data.preferredIndustries.join(', '));
    }

    // Load recommendations (matching engine)
    const recRes = await fetchApi<any[]>('/matching/recommendations');
    if (recRes.success && recRes.data) {
      setRecommendations(recRes.data);
    } else {
      // Fallback: query active mentors
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

    // Load sent requests
    const reqRes = await fetchApi<any[]>('/requests/sent');
    if (reqRes.success && reqRes.data) {
      setRequests(reqRes.data);
    }

    // Load active mentorships
    const mRes = await fetchApi<any[]>('/mentorships');
    if (mRes.success && mRes.data) {
      setMentorships(mRes.data);
      if (mRes.data.length > 0 && !selectedMentorship) {
        selectMentorship(mRes.data[0]);
      }
    }

    setLoading(false);
  };

  const selectMentorship = async (m: any) => {
    setSelectedMentorship(m);
    const detailsRes = await fetchApi<any>(`/mentorships/${m._id}`);
    if (detailsRes.success && detailsRes.data) {
      setMentorshipDetails(detailsRes.data);
    }
    // Load messages
    const msgRes = await fetchApi<any>(`/messaging/${m._id}/messages`);
    if (msgRes.success && msgRes.data) {
      setMessages(msgRes.data);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingRequest(true);
    setMessage(null);

    const res = await fetchApi<any>('/requests', {
      method: 'POST',
      body: JSON.stringify({
        mentorId: selectedMentorForRequest.mentor.alumnusId,
        careerObjective,
        requestMessage,
        preferredTopics: preferredTopics.split(',').map((t) => t.trim()),
        expectedOutcomes,
        preferredAvailability: 'Flexible weekdays / weekends',
      }),
    });

    setSubmittingRequest(false);
    if (res.success) {
      setMessage('Mentorship request successfully sent to alumnus!');
      setSelectedMentorForRequest(null);
      loadData();
      setActiveTab('requests');
      setTimeout(() => setMessage(null), 4000);
    } else {
      setMessage(`Request error: ${res.error?.message}`);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    const res = await fetchApi<any>(`/requests/${requestId}/cancel`, { method: 'POST' });
    if (res.success) {
      setMessage('Request cancelled.');
      loadData();
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleProposeSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentorship) return;

    const res = await fetchApi<any>(`/mentorships/${selectedMentorship._id}/sessions`, {
      method: 'POST',
      body: JSON.stringify({
        scheduledStartTime: new Date(sessionStartTime),
        scheduledEndTime: new Date(sessionEndTime),
        timeZone: 'UTC',
        agenda: sessionAgenda,
      }),
    });

    if (res.success) {
      setMessage('Session proposed to mentor!');
      setShowSessionModal(false);
      selectMentorship(selectedMentorship);
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage(`Scheduling error: ${res.error?.message}`);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedMentorship) return;
    setSendingMsg(true);

    const res = await fetchApi<any>(`/messaging/${selectedMentorship._id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content: chatMessage }),
    });

    setSendingMsg(false);
    if (res.success) {
      setMessages((prev) => [...prev, res.data]);
      setChatMessage('');
      if (res.data.piiDetected) {
        setMessage('Note: Direct personal contact information was automatically masked to protect privacy.');
        setTimeout(() => setMessage(null), 5000);
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

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

    if (res.success) {
      setProfile(res.data);
      setMessage('Career profile updated successfully.');
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const filteredRecommendations = recommendations.filter((item) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    const name = `${item.mentor.firstName} ${item.mentor.lastName}`.toLowerCase();
    const desig = (item.mentor.professionalDesignation || '').toLowerCase();
    const org = (item.mentor.organisation || '').toLowerCase();
    const tags = (item.mentor.expertiseTags || []).join(' ').toLowerCase();
    return name.includes(q) || desig.includes(q) || org.includes(q) || tags.includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {/* Apple Minimalist Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-black/[0.06]">
        <div>
          <Breadcrumb
            items={[
              { label: 'Campus' },
              { label: 'Mentorship' },
              { label: 'Student Workspace' },
            ]}
          />
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 mt-2">
            Student Career Workspace
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Discover verified alumni mentors, collaborate on goals, and track your career readiness.
          </p>
        </div>

        {/* Profile Readiness Gauge */}
        <div className="apple-card px-5 py-3.5 bg-white flex items-center gap-4">
          <div className="w-12 h-12 flex items-center justify-center">
            <Gauge label="Profile Readiness" value={profile?.profileCompletionScore || 20} min={0} max={100} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              Profile Readiness
            </div>
            <div className="text-lg font-bold text-neutral-900">
              {profile?.profileCompletionScore || 20}%
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className="mt-4 p-3.5 rounded-2xl bg-white border border-black/[0.06] shadow-sm text-xs text-neutral-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="mt-8">
        <Tabs defaultValue="discovery" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="discovery">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-blue-600" />
              Discover Mentors ({recommendations.length})
            </TabsTrigger>
            <TabsTrigger value="requests">
              <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
              Requests ({requests.length})
            </TabsTrigger>
            <TabsTrigger value="workspace">
              <Briefcase className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Active Workspace ({mentorships.length})
            </TabsTrigger>
            <TabsTrigger value="profile">
              <Target className="w-3.5 h-3.5 mr-1 text-purple-600" />
              Career Profile
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: MENTOR DISCOVERY */}
          <TabsContent value="discovery">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-neutral-900">
                    Recommended Verified Alumni
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Weighted multi-factor matches based on your skills, target job roles, and preferred industries.
                  </p>
                </div>
                <div className="w-full sm:w-80">
                  <ExpandingSearch
                    label="Search mentors"
                    items={recommendations.map((item, idx) => ({
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
                    }))}
                    placeholder="Search by skill, company, or role..."
                    onSelect={(item) => setSearchQuery(item.title.split('—')[0].trim())}
                  />
                </div>
              </div>

              {filteredRecommendations.length === 0 ? (
                <div className="apple-card p-12 text-center bg-white">
                  <Search className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <h3 className="font-semibold text-sm text-neutral-800">No mentors match your search</h3>
                  <p className="text-xs text-neutral-400 mt-1">Try expanding your search query or reset filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredRecommendations.map((item, idx) => (
                    <div
                      key={idx}
                      className="apple-card p-6 bg-white flex flex-col justify-between hover:shadow-md transition"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-neutral-900 text-base">
                                {item.mentor.firstName} {item.mentor.lastName}
                              </h3>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200/60 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                Verified
                              </span>
                            </div>
                            <div className="text-xs text-neutral-600 font-medium mt-0.5">
                              {item.mentor.professionalDesignation} at{' '}
                              <span className="font-semibold text-neutral-900">
                                {item.mentor.organisation}
                              </span>
                            </div>
                            <div className="text-[11px] text-neutral-400 mt-0.5">
                              {item.mentor.academicDepartment} • Class of {item.mentor.graduationYear} ({item.mentor.yearsOfExperience} yrs exp)
                            </div>
                          </div>

                          {/* Match Score Badge */}
                          <div className="flex flex-col items-end">
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                              {item.overallScore}% Match
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-neutral-500 mt-3 line-clamp-2 leading-relaxed">
                          {item.mentor.professionalSummary ||
                            'Experienced university alumnus offering career guidance and technical mentorship.'}
                        </p>

                        {/* Explainable Rationale */}
                        {item.explanation?.reasons?.length > 0 && (
                          <div className="mt-3.5 p-2.5 rounded-xl bg-[#f5f5f7] border border-black/[0.04] text-[11px] text-neutral-600 space-y-1">
                            <div className="font-semibold text-neutral-800 text-[10px] uppercase tracking-wider">
                              Why you match:
                            </div>
                            {item.explanation.reasons.map((r: string, rIdx: number) => (
                              <div key={rIdx} className="flex items-center gap-1.5 text-neutral-700">
                                <span className="w-1 h-1 rounded-full bg-blue-500" />
                                {r}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Expertise Tags */}
                        <div className="mt-4 pt-3 border-t border-neutral-100 flex flex-wrap gap-1.5">
                          {item.mentor.expertiseTags?.map((tag: string, tIdx: number) => (
                            <span
                              key={tIdx}
                              className="px-2 py-0.5 rounded-md text-[10px] bg-neutral-100 text-neutral-600 font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-end">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setSelectedMentorForRequest(item)}
                          className="rounded-full text-xs font-medium"
                        >
                          Request Mentorship
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* TAB 2: SENT REQUESTS */}
          <TabsContent value="requests">
            <div className="apple-card p-6 bg-white">
              <h2 className="text-base font-bold text-neutral-900 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                Sent Mentorship Requests ({requests.length})
              </h2>

              {requests.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-400">
                  You have not submitted any mentorship requests yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((req) => (
                    <div
                      key={req._id}
                      className="p-4 rounded-xl border border-black/[0.06] bg-[#fbfbfd] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-neutral-900">
                            {req.mentorId?.userId?.firstName} {req.mentorId?.userId?.lastName}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              req.status === 'ACCEPTED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : req.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-neutral-100 text-neutral-600'
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-600 font-medium">
                          Objective: <span className="text-neutral-900">{req.careerObjective}</span>
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          Expires in 7 days • Auto-expiration protects mentor queue
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {req.status === 'PENDING' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleCancelRequest(req._id)}
                            className="rounded-full text-xs text-rose-600 hover:text-rose-700"
                          >
                            Cancel Request
                          </Button>
                        )}
                        {req.status === 'ACCEPTED' && (
                          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Mentorship Active
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* TAB 3: ACTIVE MENTORSHIP WORKSPACE */}
          <TabsContent value="workspace">
            {mentorships.length === 0 ? (
              <div className="apple-card p-12 text-center bg-white">
                <Briefcase className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                <h3 className="font-bold text-sm text-neutral-900">No Active Mentorships Yet</h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
                  Once an alumnus accepts your mentorship request, your shared workspace with sessions, goals, and messaging will activate here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Mentorship Selector */}
                <div className="lg:col-span-1 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                    Active Mentorships
                  </h3>
                  {mentorships.map((m) => (
                    <button
                      key={m._id}
                      onClick={() => selectMentorship(m)}
                      className={`w-full text-left p-4 rounded-xl border transition ${
                        selectedMentorship?._id === m._id
                          ? 'bg-white border-neutral-900 shadow-sm'
                          : 'bg-[#fbfbfd] border-black/[0.06] hover:bg-white'
                      }`}
                    >
                      <div className="font-bold text-sm text-neutral-900">
                        {m.mentorId?.userId?.firstName} {m.mentorId?.userId?.lastName}
                      </div>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        {m.mentorId?.professionalDesignation || 'Alumni Mentor'}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active Relationship
                      </div>
                    </button>
                  ))}
                </div>

                {/* Workspace Details */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Sessions Card */}
                  <div className="apple-card p-6 bg-white">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          Mentorship Sessions
                        </h3>
                        <p className="text-xs text-neutral-500">
                          Scheduled video calls and meeting coordinates.
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setShowSessionModal(true)}
                        className="rounded-full text-xs"
                      >
                        Propose Session
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {mentorshipDetails?.sessions?.length === 0 ? (
                        <div className="p-4 text-center text-xs text-neutral-400 bg-[#f5f5f7] rounded-xl">
                          No sessions scheduled yet. Propose your first session above!
                        </div>
                      ) : (
                        mentorshipDetails?.sessions?.map((sess: any) => (
                          <div
                            key={sess._id}
                            className="p-3.5 rounded-xl border border-black/[0.04] bg-[#fbfbfd] flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-semibold text-neutral-900">
                                {new Date(sess.scheduledStartTime).toLocaleDateString()} at{' '}
                                {new Date(sess.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <div className="text-[11px] text-neutral-500">{sess.agenda}</div>
                              {sess.meetingLink && (
                                <a
                                  href={sess.meetingLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] text-blue-600 font-semibold hover:underline mt-1 inline-block"
                                >
                                  Join Google Meet Session &rarr;
                                </a>
                              )}
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                              {sess.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Messaging Card (with PII Shield) */}
                  <div className="apple-card p-6 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                        In-Platform Secure Chat
                      </h3>
                      <span className="text-[10px] font-medium text-neutral-400">
                        Zero-contact PII protection active
                      </span>
                    </div>

                    <div className="h-48 overflow-y-auto p-3 rounded-xl bg-[#f5f5f7] border border-black/[0.04] space-y-2 mb-3">
                      {messages.length === 0 ? (
                        <div className="text-center py-12 text-xs text-neutral-400">
                          Send a message to start conversation with your mentor.
                        </div>
                      ) : (
                        messages.map((msg: any, mIdx: number) => (
                          <div
                            key={mIdx}
                            className={`p-2.5 rounded-xl text-xs max-w-[85%] ${
                              msg.senderId?.role === 'STUDENT'
                                ? 'ml-auto bg-black text-white'
                                : 'mr-auto bg-white text-neutral-900 border border-black/[0.04] shadow-xs'
                            }`}
                          >
                            <div className="text-[10px] opacity-70 mb-0.5 font-medium">
                              {msg.senderId?.firstName || 'Participant'}
                            </div>
                            <div>{msg.content}</div>
                          </div>
                        ))
                      )}
                    </div>

                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        placeholder="Type a message within platform boundaries..."
                        className="flex-1 text-xs px-3.5 py-2 rounded-full border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
                      />
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={sendingMsg}
                        className="rounded-full px-4"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* TAB 4: CAREER PROFILE */}
          <TabsContent value="profile">
            <div className="apple-card p-8 bg-white max-w-2xl mx-auto">
              <h2 className="text-base font-bold text-neutral-900 mb-1 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Academic & Career Profile
              </h2>
              <p className="text-xs text-neutral-500 mb-6">
                Keep your skills and target industries up to date for precise recommendations.
              </p>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">
                      Student Roll / ID
                    </label>
                    <input
                      type="text"
                      required
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">
                      Graduation Year
                    </label>
                    <input
                      type="number"
                      required
                      value={gradYear}
                      onChange={(e) => setGradYear(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">
                      Academic Programme
                    </label>
                    <input
                      type="text"
                      required
                      value={programme}
                      onChange={(e) => setProgramme(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">
                    Technical Skills (Comma separated)
                  </label>
                  <input
                    type="text"
                    required
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">
                    Target Job Roles
                  </label>
                  <input
                    type="text"
                    required
                    value={targetRoles}
                    onChange={(e) => setTargetRoles(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">
                    Preferred Industries
                  </label>
                  <input
                    type="text"
                    required
                    value={industries}
                    onChange={(e) => setIndustries(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200"
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" variant="primary" size="md" className="rounded-full">
                    Save Profile Changes
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Request Mentorship Modal */}
      {selectedMentorForRequest && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl border border-black/[0.06]">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="font-bold text-base text-neutral-900">
                  Request Mentorship
                </h3>
                <p className="text-xs text-neutral-500">
                  To {selectedMentorForRequest.mentor.firstName} {selectedMentorForRequest.mentor.lastName} (
                  {selectedMentorForRequest.mentor.professionalDesignation})
                </p>
              </div>
              <button
                onClick={() => setSelectedMentorForRequest(null)}
                className="text-neutral-400 hover:text-neutral-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendRequest} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 uppercase mb-1">
                  Career Objective
                </label>
                <input
                  type="text"
                  required
                  value={careerObjective}
                  onChange={(e) => setCareerObjective(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 uppercase mb-1">
                  Request Message
                </label>
                <textarea
                  rows={4}
                  required
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 uppercase mb-1">
                  Preferred Mentoring Topics
                </label>
                <input
                  type="text"
                  required
                  value={preferredTopics}
                  onChange={(e) => setPreferredTopics(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedMentorForRequest(null)}
                  className="rounded-full"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submittingRequest}
                  className="rounded-full"
                >
                  {submittingRequest ? 'Sending Request...' : 'Send Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Propose Session Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-black/[0.06]">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-bold text-base text-neutral-900">Propose Session</h3>
              <button
                onClick={() => setShowSessionModal(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProposeSession} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 uppercase mb-1">
                  Start Date & Time (UTC)
                </label>
                <input
                  type="datetime-local"
                  required
                  value={sessionStartTime}
                  onChange={(e) => setSessionStartTime(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-neutral-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 uppercase mb-1">
                  End Date & Time (UTC)
                </label>
                <input
                  type="datetime-local"
                  required
                  value={sessionEndTime}
                  onChange={(e) => setSessionEndTime(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-neutral-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 uppercase mb-1">
                  Session Agenda
                </label>
                <textarea
                  rows={3}
                  required
                  value={sessionAgenda}
                  onChange={(e) => setSessionAgenda(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-neutral-200"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowSessionModal(false)}
                  className="rounded-full"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="rounded-full">
                  Submit Proposal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
