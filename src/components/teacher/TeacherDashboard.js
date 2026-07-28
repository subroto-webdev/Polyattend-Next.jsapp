'use client';
import React, { useState, useEffect } from 'react';
import api from '@/utils/api';
import Icon from '@/components/common/Icon';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

/* ------------------------------------------------------------------ */
/*  NOTE: All data-fetching, state, and business logic below is       */
/*  UNCHANGED from the original component. Only markup + styling      */
/*  (Tailwind utility classes + framer-motion) has been redesigned.   */
/* ------------------------------------------------------------------ */

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    Promise.all([
      api.get('/subjects'),
      api.get('/sessions?status=ended')
    ]).then(([s, sess]) => {
      setSubjects(s.data.subjects || []);
      setSessions(sess.data.sessions?.slice(0, 5) || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  // purely presentational clock — does not touch fetched data
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 bg-[#0A0B0F]">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-[#20242E]" />
          <div className="absolute inset-0 rounded-full border-2 border-t-indigo-400 animate-spin" />
        </div>
        <p className="text-sm text-slate-500">লোড হচ্ছে...</p>
      </div>
    );
  }

  const totalPresent = sessions.reduce((s, r) => s + (r.presentCount || 0), 0);
  const totalStudents = sessions.reduce((s, r) => s + (r.totalStudents || 0), 0);
  const avgAtt = totalStudents ? Math.round(totalPresent / totalStudents * 100) : 0;
  const classCount = [...new Set(subjects.map(s => `${s.semester}-${s.section}`))].length;

  const firstName = user?.name?.split(' ')[0] || '';
  const greeting = getGreeting(now);
  const dateStr = now.toLocaleDateString('en-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-[#0A0B0F] text-slate-200 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ---------------- HERO ---------------- */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-2xl border border-[#242938] bg-[#12141A] p-6 sm:p-8"
        >
          {/* subtle animated gradient accent */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(circle, #6366F1 0%, transparent 70%)' }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -left-16 w-64 h-64 rounded-full opacity-10 blur-3xl"
            style={{ background: 'radial-gradient(circle, #10B981 0%, transparent 70%)' }}
          />

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-semibold text-white shrink-0 shadow-lg shadow-indigo-950/40">
                {firstName.charAt(0).toUpperCase() || 'T'}
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-indigo-400 mb-1">{greeting}</p>
                <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                  {firstName}
                </h1>
                <p className="text-sm text-slate-400 mt-1">আজকে কোন class নেবেন? নিচে subject select করুন।</p>
              </div>
            </div>

            <div className="flex sm:flex-col items-start sm:items-end gap-1 shrink-0">
              <span className="text-xs text-slate-500">{dateStr}</span>
              <span className="text-lg font-medium text-slate-200 tabular-nums">{timeStr}</span>
            </div>
          </div>
        </motion.div>

        {/* ---------------- STATS ---------------- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            index={0}
            icon="book"
            label="My Subjects"
            value={subjects.length}
            accent="indigo"
          />
          <StatCard
            index={1}
            icon="clipboard"
            label="Sessions Taken"
            value={sessions.length}
            accent="blue"
          />
          <StatCard
            index={2}
            icon="chart"
            label="Avg Attendance"
            value={`${avgAtt}%`}
            accent="emerald"
          />
          <StatCard
            index={3}
            icon="users"
            label="Classes"
            value={classCount}
            accent="amber"
          />
        </div>

        {/* ---------------- SUBJECTS ---------------- */}
        <section>
          <SectionHeader title="আমার Subjects" />

          {subjects.length === 0 ? (
            <EmptyState
              icon="book"
              text={'কোনো subject নেই। "Subjects" থেকে নতুন subject তৈরি করুন।'}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {subjects.map((s, i) => (
                <motion.div
                  key={s._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
                  whileHover={{ y: -3 }}
                  className="group rounded-2xl border border-[#242938] bg-[#12141A] p-5 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-950/20 transition-colors duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="inline-flex items-center rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-300 border border-indigo-500/20">
                      {s.code}
                    </span>
                  </div>
                  <h3 className="text-base font-medium text-white mb-1.5 leading-snug">
                    {s.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {s.departmentId?.name} • Semester {s.semester} • Group {s.section}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* ---------------- RECENT SESSIONS ---------------- */}
        {sessions.length > 0 && (
          <section>
            <SectionHeader title="সাম্প্রতিক Sessions" />
            <div className="rounded-2xl border border-[#242938] bg-[#12141A] divide-y divide-[#20242E] overflow-hidden">
              {sessions.map((s, i) => {
                const pct = s.totalStudents ? Math.round(s.presentCount / s.totalStudents * 100) : 0;
                return (
                  <motion.div
                    key={s._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.2) }}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors duration-150"
                  >
                    <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <Icon name="check" size={16} className="text-emerald-400" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">
                        {s.subjectId?.name} — Group {s.section}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {s.departmentId?.name} • {new Date(s.date).toLocaleDateString('en-BD')}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-white tabular-nums">
                        {s.presentCount}/{s.totalStudents}
                      </p>
                      <p className={`text-xs mt-0.5 font-medium ${attendanceColor(pct)}`}>
                        {pct}%
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Presentational helpers only — no data logic                      */
/* ------------------------------------------------------------------ */

function getGreeting(date) {
  const h = date.getHours();
  if (h < 12) return 'শুভ সকাল';
  if (h < 17) return 'শুভ অপরাহ্ন';
  return 'শুভ সন্ধ্যা';
}

function attendanceColor(pct) {
  if (pct >= 85) return 'text-emerald-400';
  if (pct >= 60) return 'text-amber-400';
  return 'text-rose-400';
}

const ACCENTS = {
  indigo: { text: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', top: 'from-indigo-500' },
  blue: { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', top: 'from-blue-500' },
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', top: 'from-emerald-500' },
  amber: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', top: 'from-amber-500' },
  purple: { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', top: 'from-purple-500' },
  rose: { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', top: 'from-rose-500' },
};

function StatCard({ icon, label, value, accent, index }) {
  const a = ACCENTS[accent] || ACCENTS.indigo;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -2 }}
      className="relative overflow-hidden rounded-2xl border border-[#242938] bg-[#12141A] p-4 sm:p-5"
    >
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${a.top} to-transparent`} />
      <div className={`w-9 h-9 rounded-lg ${a.bg} ${a.border} border flex items-center justify-center mb-3`}>
        <Icon name={icon} size={16} className={a.text} />
      </div>
      <div className="text-2xl font-semibold text-white tracking-tight tabular-nums">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </motion.div>
  );
}

function SectionHeader({ title }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">{title}</h2>
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#2A2F3D] bg-[#12141A]/60 p-10 flex flex-col items-center justify-center text-center">
      <div className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center mb-3">
        <Icon name={icon} size={20} className="text-slate-500" />
      </div>
      <p className="text-sm text-slate-500 max-w-sm">{text}</p>
    </div>
  );
}