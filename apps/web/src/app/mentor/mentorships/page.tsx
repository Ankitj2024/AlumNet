'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  MessageSquare,
  CheckCircle2,
  Send,
  Target,
  Plus,
  ShieldCheck,
  Video,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { Breadcrumb } from '@/components/arc/breadcrumb/breadcrumb';
import { Button } from '@/components/arc/button/button';

export default function MentorMentorshipsPage() {
  const [mentorships, setMentorships] = useState<any[]>([]);
  const [selectedMentorship, setSelectedMentorship] = useState<any>(null);
  const [details, setDetails] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [loading, setLoading] = useState(true);

  // Session modal
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionDate, setSessionDate] = useState('');
  const [sessionAgenda, setSessionAgenda] = useState('');
  const [scheduling, setScheduling] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadMentorships() {
      setLoading(true);
      const res = await fetchApi<any[]>('/mentorships');
      if (res.success && res.data) {
        setMentorships(res.data);
        if (res.data.length > 0) {
          selectMentorship(res.data[0]);
        }
      }
      setLoading(false);
    }

    loadMentorships();
  }, []);

  const selectMentorship = async (m: any) => {
    setSelectedMentorship(m);
    const [detailRes, msgRes] = await Promise.all([
      fetchApi<any>(`/mentorships/${m._id}`),
      fetchApi<any[]>(`/messaging/${m._id}/messages`),
    ]);

    if (detailRes.success) setDetails(detailRes.data);
    if (msgRes.success) setMessages(msgRes.data);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedMentorship) return;

    setSendingMsg(true);
    const res = await fetchApi<any>(`/messaging/${selectedMentorship._id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content: chatInput }),
    });

    setSendingMsg(false);
    if (res.success) {
      setMessages((prev) => [...prev, res.data]);
      setChatInput('');
      if (res.data.piiDetected) {
        setToastMessage('Note: Direct personal contact info was masked by the platform PII shield.');
        setTimeout(() => setToastMessage(null), 5000);
      }
    }
  };

  const handleScheduleSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentorship) return;

    setScheduling(true);
    const res = await fetchApi<any>(`/mentorships/${selectedMentorship._id}/sessions`, {
      method: 'POST',
      body: JSON.stringify({
        scheduledStartTime: new Date(sessionDate).toISOString(),
        durationMinutes: 45,
        agenda: sessionAgenda,
      }),
    });

    setScheduling(false);
    if (res.success) {
      setShowSessionModal(false);
      setSessionDate('');
      setSessionAgenda('');
      setToastMessage('Mentorship session scheduled!');
      selectMentorship(selectedMentorship);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/[0.06]">
        <div>
          <Breadcrumb
            items={[
              { label: 'Campus' },
              { label: 'Mentor Portal' },
              { label: 'My Mentees' },
            ]}
          />
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mt-2">
            Active Mentee Collaborative Workspaces
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Coordinate video calls, review milestone goals, and communicate within platform boundaries.
          </p>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-xs text-neutral-400">Loading active mentees...</div>
      ) : mentorships.length === 0 ? (
        <div className="apple-card p-12 text-center bg-white border border-black/[0.06]">
          <Users className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
          <h3 className="font-semibold text-sm text-neutral-800">No active mentees currently</h3>
          <p className="text-xs text-neutral-400 mt-1">
            When you accept a student request, your shared workspace will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mentee List Selector */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-1">
              Active Mentees ({mentorships.length})
            </div>
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
                  Class of {m.studentId?.expectedGraduationYear} • {m.studentId?.department}
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active Mentorship
                </div>
              </button>
            ))}
          </div>

          {/* Active Workspace */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sessions Card */}
            <div className="apple-card p-6 bg-white border border-black/[0.06]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Scheduled Video Sessions
                  </h3>
                  <p className="text-xs text-neutral-500">Scheduled Google Meet calls and meeting coordinates.</p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowSessionModal(true)}
                  className="rounded-full text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Schedule Call
                </Button>
              </div>

              <div className="space-y-2.5">
                {details?.sessions?.length === 0 ? (
                  <div className="p-6 text-center text-xs text-neutral-400 bg-[#f5f5f7] rounded-xl">
                    No sessions scheduled yet. Click Schedule Call above.
                  </div>
                ) : (
                  details?.sessions?.map((sess: any) => (
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
                            className="text-[11px] text-blue-600 font-semibold hover:underline mt-1 inline-flex items-center gap-1"
                          >
                            <Video className="w-3 h-3" /> Join Google Meet &rarr;
                          </a>
                        )}
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                        {sess.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Goals Card */}
            <div className="apple-card p-6 bg-white border border-black/[0.06]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-purple-600" />
                    Student Milestone Goals
                  </h3>
                  <p className="text-xs text-neutral-500">Track milestones and progress throughout the mentorship.</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {details?.goals?.length === 0 ? (
                  <div className="p-6 text-center text-xs text-neutral-400 bg-[#f5f5f7] rounded-xl">
                    No milestones recorded yet.
                  </div>
                ) : (
                  details?.goals?.map((goal: any) => (
                    <div
                      key={goal._id}
                      className="p-3.5 rounded-xl border border-black/[0.04] bg-[#fbfbfd] flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-neutral-900">{goal.title}</div>
                        <div className="text-[11px] text-neutral-500">{goal.description}</div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700 text-[10px] font-medium">
                        {goal.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* In-Platform Secure Chat Card */}
            <div className="apple-card p-6 bg-white border border-black/[0.06]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  Secure Messaging
                </h3>
                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> PII screening shield active
                </span>
              </div>

              <div className="h-56 overflow-y-auto p-3.5 rounded-xl bg-[#f5f5f7] border border-black/[0.04] space-y-2 mb-3">
                {messages.length === 0 ? (
                  <div className="text-center py-16 text-xs text-neutral-400">
                    Send a message to start conversation with your mentee.
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
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message within platform boundaries..."
                  className="flex-1 text-xs px-3.5 py-2.5 rounded-full border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
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

      {/* SCHEDULE MODAL */}
      {showSessionModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="apple-card p-6 bg-white max-w-md w-full border border-black/[0.08] shadow-2xl relative animate-in fade-in">
            <h3 className="text-base font-bold text-neutral-900 mb-1">Schedule Video Call</h3>
            <p className="text-xs text-neutral-500 mb-4">Set meeting time and agenda for your mentee.</p>

            <form onSubmit={handleScheduleSession} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-neutral-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Agenda / Discussion Points</label>
                <textarea
                  required
                  rows={3}
                  value={sessionAgenda}
                  onChange={(e) => setSessionAgenda(e.target.value)}
                  placeholder="e.g. Technical mock interview, review project architecture..."
                  className="w-full text-xs p-3 rounded-xl border border-neutral-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowSessionModal(false)}
                  className="rounded-full text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={scheduling}
                  className="rounded-full text-xs"
                >
                  {scheduling ? 'Scheduling...' : 'Confirm Call'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

