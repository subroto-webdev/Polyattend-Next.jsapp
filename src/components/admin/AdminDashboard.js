'use client';
import React, { useState, useEffect, useRef } from 'react';
import api from '@/utils/api';
import Icon from '@/components/common/Icon';

function AnimatedNumber({ value, duration = 700 }) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const startVal = startRef.current;
    const diff = value - startVal;
    if (diff === 0) { setDisplay(value); return; }
    const startTime = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplay(Math.round(startVal + diff * eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        startRef.current = value;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return display;
}

// Returns the current hour in Bangladesh time (UTC+6), regardless of
// the server's or browser's own timezone.
function getBangladeshHour(date) {
  const bdString = date.toLocaleString('en-US', { timeZone: 'Asia/Dhaka', hour12: false, hour: '2-digit' });
  return parseInt(bdString, 10) % 24;
}

// Returns { text, icon } based on current hour (Bangladesh time).
function getGreeting(hour) {
  if (hour < 5) return { text: 'শুভ রাত্রি', icon: 'moon' };
  if (hour < 12) return { text: 'সুপ্রভাত', icon: 'sun' };
  if (hour < 16) return { text: 'শুভ দুপুর', icon: 'sun' };
  if (hour < 19) return { text: 'শুভ বিকাল', icon: 'sunset' };
  return { text: 'শুভ সন্ধ্যা', icon: 'moon' };
}

const BN_WEEKDAYS = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
const BN_MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];

function formatBanglaDate(d) {
  return `${BN_WEEKDAYS[d.getDay()]}, ${d.getDate()} ${BN_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ students: 0, teachers: 0, subjects: 0, sessions: 0 });
  const [recentSessions, setRecentSessions] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [endingId, setEndingId] = useState(null);
  const [now, setNow] = useState(new Date());
  const [adminName, setAdminName] = useState('');

  const handleEndSession = async (id) => {
    if (!confirm('এই session টা এখনই End করবেন? এর ফলে যারা এখনো attendance দেয়নি তারা absent হয়ে যাবে।')) return;
    setEndingId(id);
    try {
      await api.put(`/sessions/${id}/end`);
      setRecentSessions(prev => prev.map(s => s._id === id ? { ...s, status: 'ended' } : s));
      setActiveSessions(prev => prev.filter(s => s._id !== id));
    } catch (e) {
      alert(e?.response?.data?.message || 'Session end করা যায়নি');
    } finally {
      setEndingId(null);
    }
  };

  useEffect(() => {
    // Keep the greeting/time fresh without a full page reload.
    const timer = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const parsed = JSON.parse(raw);
        setAdminName(parsed?.name || parsed?.fullName || '');
      }
    } catch {
      // ignore — greeting just falls back to a generic label
    }
  }, []);

  useEffect(() => {
    Promise.all([
      api.get('/users?role=student'),
      api.get('/users?role=teacher'),
      api.get('/subjects'),
      api.get('/sessions'),
      api.get('/sessions?status=active'),
    ]).then(([st, te, su, se, act]) => {
      setStats({
        students: st.data.count || 0,
        teachers: te.data.count || 0,
        subjects: su.data.subjects?.length || 0,
        sessions: se.data.count || 0,
      });
      setRecentSessions(se.data.sessions?.slice(0, 6) || []);
      // Fetched separately (not just top-6-recent) so an old/stray session
      // that's still active never scrolls out of view.
      setActiveSessions(act.data.sessions || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const statConfigs = [
    { key: 'students', label: 'Students', icon: 'users', cls: 'stat-blue', value: stats.students },
    { key: 'teachers', label: 'Teachers', icon: 'users', cls: 'stat-green', value: stats.teachers },
    { key: 'subjects', label: 'Subjects', icon: 'book', cls: 'stat-amber', value: stats.subjects },
    { key: 'sessions', label: 'Sessions', icon: 'clipboard', cls: 'stat-purple', value: stats.sessions },
  ];

  const greeting = getGreeting(getBangladeshHour(now));

  return (
    <div className="page rp-dash">
      <style>{`
        @keyframes rpFadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes rpShimmerBg { 0% { background-position: 100% 0; } 100% { background-position: 0 0; } }
        @keyframes rpPulseRing { 0% { transform: scale(0.6); opacity: 0.8; } 100% { transform: scale(1.9); opacity: 0; } }

        .rp-dash .rp-anim-field { animation: rpFadeUp .45s cubic-bezier(.16,1,.3,1) both; }

        /* Greeting banner */
        .rp-dash .rp-greet {
          display: flex; align-items: center; gap: 14px;
          padding: 18px 20px; border-radius: 14px; margin-bottom: 20px;
          background: linear-gradient(135deg, var(--primary, #4f46e5) 0%, var(--primary-dark, #4338ca) 100%);
          color: #fff; position: relative; overflow: hidden;
        }
        .rp-dash .rp-greet::after {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(circle at 85% -20%, rgba(255,255,255,0.25), transparent 55%);
          pointer-events: none;
        }
        .rp-dash .rp-greet-logo {
          width: 46px; height: 46px; border-radius: 12px; flex-shrink: 0;
          background: rgba(255,255,255,0.18); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; font-weight: 700;
        }
        .rp-dash .rp-greet-text { position: relative; z-index: 1; }
        .rp-dash .rp-greet-title { font-size: 17px; font-weight: 700; line-height: 1.3; display: flex; align-items: center; gap: 8px; }
        .rp-dash .rp-greet-name { opacity: 0.95; }
        .rp-dash .rp-greet-sub { font-size: 12.5px; opacity: 0.85; margin-top: 2px; }
        .rp-dash .rp-greet-icon { display: inline-flex; }

        .rp-dash .rp-stat-card { transition: transform .22s cubic-bezier(.34,1.56,.64,1), box-shadow .22s ease; }
        .rp-dash .rp-stat-card:hover { transform: translateY(-3px); box-shadow: 0 10px 22px -12px rgba(0,0,0,0.25); }
        .rp-dash .rp-stat-icon { transition: transform .25s ease; }
        .rp-dash .rp-stat-card:hover .rp-stat-icon { transform: scale(1.15) rotate(-4deg); }

        .rp-dash .rp-list-row { transition: background .2s ease, transform .2s ease; border-radius: 8px; }
        .rp-dash .rp-list-row:hover { background: rgba(0,0,0,0.035); transform: translateX(2px); }

        .rp-dash .rp-tag-live { display: inline-flex; align-items: center; gap: 5px; }
        .rp-dash .rp-live-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; position: relative; display: inline-block; }
        .rp-dash .rp-live-dot::after {
          content: ''; position: absolute; inset: -3px; border-radius: 50%; border: 1px solid #22c55e;
          animation: rpPulseRing 1.6s ease-out infinite;
        }

        .rp-dash .rp-skel {
          background: linear-gradient(90deg, var(--border2) 25%, var(--border) 37%, var(--border2) 63%);
          background-size: 400% 100%; animation: rpShimmerBg 1.4s ease infinite; border-radius: 6px;
        }
        .rp-dash .rp-skel-icon { width: 32px; height: 32px; border-radius: 8px; margin-bottom: 10px; }
        .rp-dash .rp-skel-val { width: 50%; height: 22px; margin-bottom: 8px; }
        .rp-dash .rp-skel-lbl { width: 70%; height: 12px; }
        .rp-dash .rp-skel-row { display: flex; align-items: center; gap: 12px; padding: 12px 4px; }
        .rp-dash .rp-skel-circle { width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; }
        .rp-dash .rp-skel-line { height: 11px; border-radius: 4px; }

        @media (prefers-reduced-motion: reduce) {
          .rp-dash .rp-anim-field, .rp-dash .rp-stat-card, .rp-dash .rp-stat-icon,
          .rp-dash .rp-list-row, .rp-dash .rp-live-dot::after, .rp-dash .rp-skel {
            animation: none !important; transition: none !important;
          }
        }

        @media (max-width: 480px) {
          .rp-dash .rp-greet { padding: 14px 16px; gap: 10px; }
          .rp-dash .rp-greet-logo { width: 38px; height: 38px; font-size: 16px; }
          .rp-dash .rp-greet-title { font-size: 15px; }
        }
      `}</style>

      <div className="rp-greet rp-anim-field" style={{ animationDelay: '0ms' }}>
        <div className="rp-greet-logo">AD</div>
        <div className="rp-greet-text">
          <div className="rp-greet-title">
            <span className="rp-greet-icon"><Icon name={greeting.icon} size={18} /></span>
            <span>{greeting.text},</span>
            <span className="rp-greet-name">{adminName || 'Admin'}</span>
          </div>
          <div className="rp-greet-sub">{formatBanglaDate(now)}</div>
        </div>
      </div>

      <div className="page-header rp-anim-field" style={{ animationDelay: '40ms' }}>
        <h2 className="page-title">Admin Dashboard</h2>
        <p className="page-sub">System overview এবং সামগ্রিক পরিসংখ্যান</p>
      </div>

      <div className="stats-grid">
        {loading
          ? [0, 1, 2, 3].map(i => (
            <div key={i} className="stat-card rp-anim-field" style={{ animationDelay: `${i * 70}ms` }}>
              <div className="rp-skel rp-skel-icon" />
              <div className="rp-skel rp-skel-val" />
              <div className="rp-skel rp-skel-lbl" />
            </div>
          ))
          : statConfigs.map((c, i) => (
            <div key={c.key} className={`stat-card ${c.cls} rp-stat-card rp-anim-field`} style={{ animationDelay: `${i * 70}ms` }}>
              <div className="stat-icon rp-stat-icon"><Icon name={c.icon} size={18} /></div>
              <div className="stat-val"><AnimatedNumber value={c.value} /></div>
              <div className="stat-lbl">{c.label}</div>
            </div>
          ))
        }
      </div>

      {activeSessions.length > 0 && (
        <>
          <div className="section-title rp-anim-field" style={{ animationDelay: '260ms', color: 'var(--danger, #ef4444)' }}>
            এখন Active Sessions ({activeSessions.length})
          </div>
          <div className="card rp-anim-field" style={{ animationDelay: '280ms', marginBottom: 20, border: '1px solid rgba(239,68,68,0.35)' }}>
            {activeSessions.map((s, i) => (
              <div key={s._id} className="list-item rp-list-row" style={{ cursor: 'default' }}>
                <div className="item-icon icon-green"><Icon name="clipboard" size={18} /></div>
                <div className="item-content">
                  <div className="item-title">{s.subjectId?.name} — {s.section}</div>
                  <div className="item-sub">{s.departmentId?.name} • {s.teacherId?.name} • {new Date(s.date).toLocaleDateString()}</div>
                </div>
                <div className="item-right" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.presentCount}/{s.totalStudents}</div>
                  <button
                    className="btn-danger btn-sm"
                    disabled={endingId === s._id}
                    onClick={() => handleEndSession(s._id)}
                  >
                    {endingId === s._id ? '...' : 'End'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="section-title rp-anim-field" style={{ animationDelay: '280ms' }}>সাম্প্রতিক Sessions</div>
      <div className="card rp-anim-field" style={{ animationDelay: '320ms' }}>
        {loading ? (
          [0, 1, 2].map(i => (
            <div key={i} className="list-item rp-skel-row" style={{ cursor: 'default' }}>
              <div className="rp-skel rp-skel-circle" />
              <div className="item-content" style={{ flex: 1 }}>
                <div className="rp-skel rp-skel-line" style={{ width: '60%' }} />
                <div className="rp-skel rp-skel-line" style={{ width: '40%', marginTop: 6 }} />
              </div>
            </div>
          ))
        ) : recentSessions.length === 0 ? (
          <div className="empty rp-anim-field"><p>কোনো session নেই</p></div>
        ) : recentSessions.map((s, i) => (
          <div key={s._id} className="list-item rp-list-row rp-anim-field" style={{ cursor: 'default', animationDelay: `${i * 50}ms` }}>
            <div className="item-icon icon-green"><Icon name="clipboard" size={18} /></div>
            <div className="item-content">
              <div className="item-title">{s.subjectId?.name} — {s.section}</div>
              <div className="item-sub">{s.departmentId?.name} • {s.teacherId?.name} • {new Date(s.date).toLocaleDateString()}</div>
            </div>
            <div className="item-right" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{s.presentCount}/{s.totalStudents}</div>
                <span className={`tag ${s.status === 'active' ? 'tag-green rp-tag-live' : 'tag-gray'}`} style={{ fontSize: 10 }}>
                  {s.status === 'active' && <span className="rp-live-dot" />}
                  {s.status}
                </span>
              </div>
              {s.status === 'active' && (
                <button
                  className="btn-danger btn-sm"
                  disabled={endingId === s._id}
                  onClick={() => handleEndSession(s._id)}
                  title="আটকে থাকা / test session বন্ধ করুন"
                >
                  {endingId === s._id ? '...' : 'End'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}