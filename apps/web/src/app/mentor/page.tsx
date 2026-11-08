'use client';

import React, { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import {
  ShieldCheck,
  Zap,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Clock,
  Save,
  Pause,
  Play,
  FileText,
  Building,
  Upload,
  Check,
  X,
  MessageSquare,
  Calendar,
  Send,
  Users,
} from 'lucide-react';
import { Button } from '@/components/arc/button/button';
import { Switch } from '@/components/arc/switch/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/arc/tabs/tabs';
import { Breadcrumb } from '@/components/arc/breadcrumb/breadcrumb';
import { MetricCard } from '@/components/arc/metric-card/metric-card';

export default function MentorPortal() {
  const [profile, setProfile] = useState<any>(null);
  const [capacity, setCapacity] = useState<any>(null);
  const [verification, setVerification] = useState<any>(null);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [mentorships, setMentorships] = useState<any[]>([]);
  const [selectedMentorship, setSelectedMentorship] = useState<any>(null);
  const [mentorshipDetails, setMentorshipDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Chat state
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [sendingMsg, setSendingMsg] = useState(false);

  // Verification submission form
  const [submittedId, setSubmittedId] = useState('');
  const [gradYear, setGradYear] = useState(2022);
  const [dept, setDept] = useState('');
  const [degree, setDegree] = useState('B.Tech Computer Science');
  const [docUrl, setDocUrl] = useState('');

  // Profile fields
  const [designation, setDesignation] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [industry, setIndustry] = useState('');
  const [experience, setExperience] = useState(5);
  const [summary, setSummary] = useState('');
  const [tags, setTags] = useState('Distributed Systems, Cloud Architecture, Leadership');
  const [topics, setTopics] = useState('Career Growth, System Design Interviews, Resume Review');

  // Capacity fields
  const [maxMentees, setMaxMentees] = useState(2);
  const [isPaused, setIsPaused] = useState(false);

  const loadData = async () => {
    setLoading(true);

    // Profile & Capacity
    const profileRes = await fetchApi<any>('/alumni/profile/me');
    if (profileRes.success && profileRes.data) {
      const p = profileRes.data.profile;
      const c = profileRes.data.capacity;
      setProfile(p);
      setCapacity(c);
      if (p) {
        setDesignation(p.professionalDesignation || '');
        setOrganisation(p.organisation || '');
        setIndustry(p.industry || '');
        setExperience(p.yearsOfExperience || 0);
        setSummary(p.professionalSummary || '');
        if (p.expertiseTags?.length) setTags(p.expertiseTags.join(', '));
        if (p.mentoringTopics?.length) setTopics(p.mentoringTopics.join(', '));
      }
      if (c) {
        setMaxMentees(c.maxActiveMentees || 2);
        setIsPaused(c.isPaused || false);
      }
    }

    // Verification status
    const verifRes = await fetchApi<any>('/alumni/verification/status');
    if (verifRes.success && verifRes.data) {
      setVerification(verifRes.data.request);
      if (verifRes.data.alumnus) {
        setSubmittedId(verifRes.data.alumnus.institutionalId || '');
        setGradYear(verifRes.data.alumnus.graduationYear || 2022);
        setDept(verifRes.data.alumnus.academicDepartment || '');
        setDegree(verifRes.data.alumnus.degree || 'B.Tech');
      }
    }

    // Incoming requests
    const reqRes = await fetchApi<any[]>('/requests/incoming');
    if (reqRes.success && reqRes.data) {
      setIncomingRequests(reqRes.data);
    }

    // Active mentorships
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
    const msgRes = await fetchApi<any>(`/messaging/${m._id}/messages`);
    if (msgRes.success && msgRes.data) {
      setMessages(msgRes.data);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateCapacity = async (newMax: number, pausedState: boolean) => {
    setSaving(true);
    const res = await fetchApi<any>('/alumni/capacity', {
      method: 'PUT',
      body: JSON.stringify({
        maxActiveMentees: Number(newMax),
        isAcceptingRequests: !pausedState,
        isPaused: pausedState,
      }),
    });
    setSaving(false);
    if (res.success) {
      setCapacity(res.data);
      setMaxMentees(res.data.maxActiveMentees);
      setIsPaused(res.data.isPaused);
      setMessage('Mentoring capacity and pause settings updated.');
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    setMessage(null);
    const res = await fetchApi<any>(`/requests/${requestId}/accept`, { method: 'POST' });
    if (res.success) {
      setMessage('Mentorship request accepted! Capacity slot atomically reserved.');
      loadData();
      setTimeout(() => setMessage(null), 4000);
    } else {
      setMessage(`Acceptance error: ${res.error?.message}`);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    const res = await fetchApi<any>(`/requests/${requestId}/decline`, {
      method: 'POST',
      body: JSON.stringify({ declineReason: 'At current professional capacity limit.' }),
    });
    if (res.success) {
      setMessage('Request declined with zero rating penalty.');
      loadData();
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleConfirmSession = async (sessionId: string) => {
    if (!selectedMentorship) return;
    const res = await fetchApi<any>(
      `/mentorships/${selectedMentorship._id}/sessions/${sessionId}/confirm`,
      { method: 'POST' }
    );
    if (res.success) {
      setMessage('Session confirmed! Meeting link activated.');
      selectMentorship(selectedMentorship);
      setTimeout(() => setMessage(null), 3000);
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

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const res = await fetchApi<any>('/alumni/verification/submit', {
      method: 'POST',
      body: JSON.stringify({
        submittedAlumniId: submittedId,
        graduationYear: Number(gradYear),
        academicDepartment: dept,
        degree,
        documentUrls: docUrl ? [docUrl] : [],
      }),
    });

    setSaving(false);
    if (res.success) {
      setVerification(res.data);
      setMessage(
        res.data.status === 'VERIFIED'
          ? 'Instantly verified against institutional registrar ERP records!'
          : 'Credentials submitted for officer review.'
      );
      loadData();
      setTimeout(() => setMessage(null), 4000);
    } else {
      setMessage(`Verification submission failed: ${res.error?.message}`);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const res = await fetchApi<any>('/alumni/profile/me', {
      method: 'PUT',
      body: JSON.stringify({
        professionalDesignation: designation,
        organisation,
        industry,
        yearsOfExperience: Number(experience),
        professionalSummary: summary,
        expertiseTags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        mentoringTopics: topics.split(',').map((t) => t.trim()).filter(Boolean),
      }),
    });

    setSaving(false);
    if (res.success) {
      setMessage('Professional profile saved successfully.');
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const isVerified = profile?.verificationStatus === 'VERIFIED';
  const pendingRequestsCount = incomingRequests.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {/* Apple Minimalist Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-black/[0.06]">
        <div>
          <Breadcrumb
            items={[
              { label: 'Campus' },
              { label: 'Mentorship' },
              { label: 'Mentor Workspace' },
            ]}
          />
          <div className="flex items-center gap-2.5 mt-2">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
              Alumni Mentor Workspace
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                isVerified
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  : 'bg-amber-50 text-amber-700 border border-amber-200/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {isVerified ? 'Institutionally Verified' : 'Pending Verification'}
            </span>
          </div>
          <p className="text-sm text-neutral-500 mt-0.5">
            Manage your professional profile, mentee capacity, availability, and active mentees.
          </p>
        </div>

        {/* Capacity Quick Gauge */}
        <div className="apple-card px-5 py-3.5 bg-white flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-neutral-100 text-neutral-900">
            <Zap className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              Mentee Capacity Load
            </div>
            <div className="text-lg font-bold text-neutral-900">
              {capacity?.currentActiveMentees ?? 0} / {capacity?.maxActiveMentees ?? 2}{' '}
              <span className="text-xs text-neutral-400 font-normal">Active</span>
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

      {/* Tabs */}
      <div className="mt-8">
        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="requests">
              <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
              Incoming Requests ({pendingRequestsCount})
            </TabsTrigger>
            <TabsTrigger value="workspace">
              <Users className="w-3.5 h-3.5 mr-1 text-blue-600" />
              Active Mentees ({mentorships.length})
            </TabsTrigger>
            <TabsTrigger value="capacity">
              <Zap className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Capacity & Availability
            </TabsTrigger>
            <TabsTrigger value="profile">
              <Briefcase className="w-3.5 h-3.5 mr-1 text-purple-600" />
              Professional Profile
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: INCOMING REQUESTS */}
          <TabsContent value="requests">
            <div className="apple-card p-6 bg-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-neutral-900">
                    Incoming Mentorship Requests
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Review student proposals. Accepting atomically reserves 1 of your capacity slots.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700">
                  {incomingRequests.filter((r) => r.status === 'PENDING').length} Pending
                </span>
              </div>

              {incomingRequests.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-400">
                  No incoming requests at this moment.
                </div>
              ) : (
                <div className="space-y-4">
                  {incomingRequests.map((req) => (
                    <div
                      key={req._id}
                      className="p-5 rounded-2xl border border-black/[0.06] bg-[#fbfbfd] space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-neutral-900">
                              {req.studentId?.userId?.firstName} {req.studentId?.userId?.lastName}
                            </span>
                            <span className="text-xs text-neutral-500">
                              ({req.studentId?.academicProgramme} in {req.studentId?.department})
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                req.status === 'ACCEPTED'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : req.status === 'PENDING'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-neutral-100 text-neutral-600'
                              }`}
                            >
                              {req.status}
                            </span>
                          </div>
                          <div className="text-xs text-neutral-700 mt-1">
                            <span className="font-semibold">Objective:</span> {req.careerObjective}
                          </div>
                        </div>

                        {req.status === 'PENDING' && (
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleAcceptRequest(req._id)}
                              className="rounded-full text-xs bg-emerald-600 hover:bg-emerald-700"
                            >
                              <Check className="w-3.5 h-3.5 mr-1" />
                              Accept Mentee
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleDeclineRequest(req._id)}
                              className="rounded-full text-xs text-rose-600 hover:text-rose-700"
                            >
                              <X className="w-3.5 h-3.5 mr-1" />
                              Decline
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-neutral-600 bg-white p-3.5 rounded-xl border border-black/[0.04] leading-relaxed">
                        "{req.requestMessage}"
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-400">
                        <div>
                          Preferred Topics:{' '}
                          <span className="text-neutral-700 font-medium">
                            {req.preferredTopics?.join(', ') || 'Career Growth'}
                          </span>
                        </div>
                        <div>•</div>
                        <div>
                          Availability:{' '}
                          <span className="text-neutral-700 font-medium">
                            {req.preferredAvailability || 'Flexible'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* TAB 2: ACTIVE MENTEES WORKSPACE */}
          <TabsContent value="workspace">
            {mentorships.length === 0 ? (
              <div className="apple-card p-12 text-center bg-white">
                <Users className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                <h3 className="font-bold text-sm text-neutral-900">No Active Mentees Currently</h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
                  When you accept student requests, your active mentoring workspaces and session schedules will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Mentee List */}
                <div className="lg:col-span-1 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                    Current Mentees
                  </h3>
                  {mentorships.map((m) => (
                    <button
                      key={m._id}
                      onClick={() => selectMentorship(m)}
                      className={`w-full text-left p-4 rounded-2xl border transition ${
                        selectedMentorship?._id === m._id
                          ? 'bg-white border-neutral-900 shadow-sm'
                          : 'bg-[#fbfbfd] border-black/[0.06] hover:bg-white'
                      }`}
                    >
                      <div className="font-bold text-sm text-neutral-900">
                        {m.studentId?.userId?.firstName} {m.studentId?.userId?.lastName}
                      </div>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        {m.studentId?.academicProgramme} • {m.studentId?.department}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active Mentorship
                      </div>
                    </button>
                  ))}
                </div>

                {/* Workspace Details */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Sessions Card */}
                  <div className="apple-card p-6 bg-white">
                    <h3 className="font-bold text-sm text-neutral-900 mb-1 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      Scheduled Sessions
                    </h3>
                    <p className="text-xs text-neutral-500 mb-4">
                      Review proposed slots from student or launch Google Meet.
                    </p>

                    <div className="space-y-2">
                      {mentorshipDetails?.sessions?.length === 0 ? (
                        <div className="p-4 text-center text-xs text-neutral-400 bg-[#f5f5f7] rounded-xl">
                          No sessions proposed yet for this mentorship.
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
                              {sess.status === 'CONFIRMED' && sess.meetingLink && (
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

                            <div>
                              {sess.status === 'PROPOSED' ? (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleConfirmSession(sess._id)}
                                  className="rounded-full text-xs"
                                >
                                  Confirm Session
                                </Button>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                                  {sess.status}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Messaging Card */}
                  <div className="apple-card p-6 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                        In-Platform Chat with Mentee
                      </h3>
                      <span className="text-[10px] font-medium text-neutral-400">
                        Zero-contact PII screening active
                      </span>
                    </div>

                    <div className="h-48 overflow-y-auto p-3 rounded-xl bg-[#f5f5f7] border border-black/[0.04] space-y-2 mb-3">
                      {messages.length === 0 ? (
                        <div className="text-center py-12 text-xs text-neutral-400">
                          No messages yet. Send a greeting to your mentee!
                        </div>
                      ) : (
                        messages.map((msg: any, mIdx: number) => (
                          <div
                            key={mIdx}
                            className={`p-2.5 rounded-xl text-xs max-w-[85%] ${
                              msg.senderId?.role === 'ALUMNI_MENTOR'
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

          {/* TAB 3: CAPACITY & AVAILABILITY */}
          <TabsContent value="capacity">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Capacity Invariant Card */}
              <div className="apple-card p-6 sm:p-8 bg-white space-y-6">
                <div>
                  <h3 className="font-bold text-base text-neutral-900 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-emerald-600" />
                    Capacity Protection
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                    Set your maximum concurrent student limit. The platform enforces this invariant atomically.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#f5f5f7] space-y-3">
                  <div className="flex justify-between items-center text-xs font-semibold text-neutral-700">
                    <span>Active Mentee Capacity Limit:</span>
                    <span className="text-lg font-bold text-neutral-900">{maxMentees} Mentees</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={maxMentees}
                    onChange={(e) => setMaxMentees(Number(e.target.value))}
                    className="w-full accent-black cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400">
                    <span>1 mentee</span>
                    <span>5 mentees</span>
                    <span>10 max</span>
                  </div>
                </div>

                {/* Pause Switch using @uiarc/switch */}
                <div className="p-4 rounded-2xl bg-[#f5f5f7] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-neutral-900">
                      Pause Incoming Requests
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      Temporarily removes your profile from discovery
                    </div>
                  </div>
                  <Switch
                    checked={isPaused}
                    onCheckedChange={(checked) => handleUpdateCapacity(maxMentees, checked)}
                  />
                </div>

                <Button
                  variant="primary"
                  size="md"
                  disabled={saving}
                  onClick={() => handleUpdateCapacity(maxMentees, isPaused)}
                  className="w-full rounded-full"
                >
                  Save Capacity Settings
                </Button>
              </div>

              {/* Institutional Verification Card */}
              <div className="apple-card p-6 sm:p-8 bg-white space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-neutral-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    Institutional Verification
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 uppercase tracking-wider text-neutral-700">
                    {profile?.verificationStatus || 'NOT_SUBMITTED'}
                  </span>
                </div>

                {isVerified ? (
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200/60 text-emerald-900 text-xs space-y-2">
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Verified Graduate
                    </div>
                    <p className="text-emerald-700 text-xs leading-relaxed">
                      Your identity has been authenticated against institutional registrar records.
                    </p>
                    <div className="text-[11px] text-neutral-500 pt-1">
                      Institutional ID: <span className="font-mono font-medium">{profile?.institutionalId}</span>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitVerification} className="space-y-3">
                    <p className="text-xs text-neutral-500">
                      Submit your university alumni credentials to gain verified status and appear in student discovery.
                    </p>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-700 uppercase mb-1">
                        Institutional Alumni ID
                      </label>
                      <input
                        type="text"
                        required
                        value={submittedId}
                        onChange={(e) => setSubmittedId(e.target.value)}
                        placeholder="e.g. ALUM-2022-CS-001"
                        className="w-full text-xs px-3.5 py-2 rounded-xl border border-neutral-200 uppercase"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-700 uppercase mb-1">
                          Grad Year
                        </label>
                        <input
                          type="number"
                          required
                          value={gradYear}
                          onChange={(e) => setGradYear(Number(e.target.value))}
                          className="w-full text-xs px-3.5 py-2 rounded-xl border border-neutral-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-700 uppercase mb-1">
                          Department
                        </label>
                        <input
                          type="text"
                          required
                          value={dept}
                          onChange={(e) => setDept(e.target.value)}
                          placeholder="e.g. Computer Science"
                          className="w-full text-xs px-3.5 py-2 rounded-xl border border-neutral-200"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-700 uppercase mb-1">
                        Degree Awarded
                      </label>
                      <input
                        type="text"
                        required
                        value={degree}
                        onChange={(e) => setDegree(e.target.value)}
                        className="w-full text-xs px-3.5 py-2 rounded-xl border border-neutral-200"
                      />
                    </div>

                    <Button type="submit" variant="primary" size="md" className="w-full rounded-full">
                      Submit Credentials for Verification
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </TabsContent>

          {/* TAB 4: PROFESSIONAL PROFILE */}
          <TabsContent value="profile">
            <div className="apple-card p-8 bg-white max-w-2xl mx-auto space-y-4">
              <h2 className="text-base font-bold text-neutral-900 mb-1 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-600" />
                Professional Profile
              </h2>
              <p className="text-xs text-neutral-500 mb-6">
                Students will view these professional attributes when exploring mentors. Contact info is never displayed.
              </p>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">
                      Professional Designation
                    </label>
                    <input
                      type="text"
                      required
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">
                      Organisation
                    </label>
                    <input
                      type="text"
                      required
                      value={organisation}
                      onChange={(e) => setOrganisation(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">
                      Industry
                    </label>
                    <input
                      type="text"
                      required
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      required
                      value={experience}
                      onChange={(e) => setExperience(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">
                    Professional Summary
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">
                    Expertise Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    required
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 uppercase mb-1">
                    Mentoring Topics Offered
                  </label>
                  <input
                    type="text"
                    required
                    value={topics}
                    onChange={(e) => setTopics(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200"
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" variant="primary" size="md" className="rounded-full">
                    Save Professional Profile
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
