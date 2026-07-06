'use client';
import React, { useState, useEffect } from 'react';
import api from '@/utils/api';
import Icon from '@/components/common/Icon';
import toast from 'react-hot-toast';

export default function TeacherExport() {
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [activeTab, setActiveTab] = useState('subject'); // subject | session | student
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [downloading, setDownloading] = useState(null); // stores id being downloaded

  useEffect(() => {
    api.get('/subjects')
      .then(r => setSubjects(r.data.subjects || []))
      .catch(() => toast.error('Subject load করতে সমস্যা'))
      .finally(() => setLoadingSubjects(false));

    api.get('/sessions?status=ended')
      .then(r => setSessions(r.data.sessions || []))
      .catch(() => toast.error('Session load করতে সমস্যা'))
      .finally(() => setLoadingSessions(false));
  }, []);

  const triggerDownload = (blob, filename) => {
    const url = window.URL.createObjectURL(new Blob([blob]));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const downloadSubjectReport = async (subject) => {
    setDownloading(subject._id);
    try {
      const res = await api.get(`/reports/subject/${subject._id}`, { responseType: 'blob' });
      triggerDownload(res.data, `${subject.code}_${subject.section}_report.xlsx`);
      toast.success(`"${subject.name}" report download হয়েছে!`);
    } catch {
      toast.error('Download ব্যর্থ হয়েছে');
    } finally {
      setDownloading(null);
    }
  };

  const downloadSessionReport = async (session) => {
    setDownloading(session._id);
    try {
      const res = await api.get(`/reports/class/${session._id}`, { responseType: 'blob' });
      const dateStr = new Date(session.date).toLocaleDateString('en-BD').replace(/\//g, '-');
      triggerDownload(res.data, `session_${session.subjectId?.code || 'report'}_${dateStr}.xlsx`);
      toast.success('Session report download হয়েছে!');
    } catch {
      toast.error('Download ব্যর্থ হয়েছে');
    } finally {
      setDownloading(null);
    }
  };

  const downloadStudentReport = async (student) => {
    setDownloading(student._id);
    try {
      const res = await api.get(`/reports/student/${student._id}`, { responseType: 'blob' });
      triggerDownload(res.data, `student_${student.studentId || student.name}_report.xlsx`);
      toast.success(`${student.name}-এর report download হয়েছে!`);
    } catch {
      toast.error('Download ব্যর্থ হয়েছে');
    } finally {
      setDownloading(null);
    }
  };

  const searchStudents = async () => {
    const q = studentSearch.trim();
    if (!q) return toast.error('নাম বা Student ID দিন');
    try {
      const res = await api.get('/users', { params: { role: 'student', search: q } });
      const found = res.data.users || [];
      setStudents(found);
      if (found.length === 0) toast('কোনো student পাওয়া যায়নি', { icon: '🔍' });
    } catch {
      toast.error('Student খুঁজতে সমস্যা হয়েছে');
    }
  };

  const tabs = [
    { key: 'subject', label: 'Subject Report', icon: 'book' },
    { key: 'session', label: 'Session Report', icon: 'clipboard' },
    { key: 'student', label: 'Student Report', icon: 'users' },
  ];

  return (
    <div>
      <div className="action-bar">
        <Icon name="excel" size={18} style={{ color: 'var(--txt2)' }} />
        <span className="action-bar-title">Excel Export</span>
      </div>

      <div className="page" style={{ paddingTop: 8 }}>
        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 4, marginBottom: 16, border: '1px solid var(--border)' }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                padding: '8px 4px',
                border: 'none',
                borderRadius: 'calc(var(--radius) - 2px)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: activeTab === tab.key ? 700 : 400,
                background: activeTab === tab.key ? 'var(--primary)' : 'transparent',
                color: activeTab === tab.key ? '#fff' : 'var(--txt2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              <Icon name={tab.icon} size={14} />
              <span style={{ display: window.innerWidth < 400 ? 'none' : undefined }}>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── Subject Report Tab ── */}
        {activeTab === 'subject' && (
          <>
            <div className="info-banner mb-3">
              <Icon name="info" size={16} />
              <span className="info-text">Subject-এর সব session ও student-এর পূর্ণ Excel report download করুন</span>
            </div>
            {loadingSubjects ? (
              <div className="loading"><div className="spinner" /></div>
            ) : subjects.length === 0 ? (
              <div className="card"><div className="empty"><Icon name="book" size={32} /><p>কোনো subject নেই</p></div></div>
            ) : (
              <div className="card">
                {subjects.map(s => (
                  <div key={s._id} className="list-item">
                    <div className="item-icon icon-green">
                      <Icon name="book" size={18} />
                    </div>
                    <div className="item-content">
                      <div className="item-title">{s.name} <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--txt2)' }}>({s.code})</span></div>
                      <div className="item-sub">
                        {s.departmentId?.name} • Sem {s.semester} • Sec {s.section} • {s.shift} Shift
                      </div>
                    </div>
                    <button
                      className="btn-secondary btn-sm"
                      onClick={() => downloadSubjectReport(s)}
                      disabled={downloading === s._id}
                      title="Full Subject Excel Download"
                    >
                      {downloading === s._id
                        ? <div className="spinner spinner-sm" />
                        : <><Icon name="download" size={14} /> Excel</>
                      }
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Session Report Tab ── */}
        {activeTab === 'session' && (
          <>
            <div className="info-banner mb-3">
              <Icon name="info" size={16} />
              <span className="info-text">প্রতিটি class session-এর attendance list download করুন</span>
            </div>
            {loadingSessions ? (
              <div className="loading"><div className="spinner" /></div>
            ) : sessions.length === 0 ? (
              <div className="card"><div className="empty"><Icon name="clipboard" size={32} /><p>কোনো completed session নেই</p></div></div>
            ) : (
              <div className="card">
                {sessions.map(s => (
                  <div key={s._id} className="list-item">
                    <div className="item-icon icon-blue">
                      <Icon name="calendar" size={18} />
                    </div>
                    <div className="item-content">
                      <div className="item-title">{s.subjectId?.name} — Sem {s.semester} {s.section}</div>
                      <div className="item-sub">
                        {new Date(s.date).toLocaleDateString('en-BD', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        {' '}• {s.presentCount}/{s.totalStudents} present
                      </div>
                    </div>
                    <button
                      className="btn-secondary btn-sm"
                      onClick={() => downloadSessionReport(s)}
                      disabled={downloading === s._id}
                      title="Session Attendance Download"
                    >
                      {downloading === s._id
                        ? <div className="spinner spinner-sm" />
                        : <Icon name="download" size={14} />
                      }
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Student Report Tab ── */}
        {activeTab === 'student' && (
          <>
            <div className="info-banner mb-3">
              <Icon name="info" size={16} />
              <span className="info-text">Student-এর নাম বা ID দিয়ে খুঁজুন, তারপর report download করুন</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                className="form-input"
                placeholder="Student নাম বা ID লিখুন..."
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchStudents()}
                style={{ flex: 1 }}
              />
              <button className="btn-secondary" onClick={searchStudents}>
                <Icon name="search" size={16} />
              </button>
            </div>
            <div className="card">
              {students.length === 0 ? (
                <div className="empty">
                  <Icon name="search" size={32} />
                  <p>Student খুঁজুন, তারপর report download করুন</p>
                </div>
              ) : (
                students.map(s => (
                  <div key={s._id} className="list-item">
                    <div className="item-icon icon-amber">
                      <Icon name="users" size={18} />
                    </div>
                    <div className="item-content">
                      <div className="item-title">{s.name}</div>
                      <div className="item-sub">
                        {s.studentId} • {s.departmentId?.name} • Sem {s.semester} • Sec {s.section}
                      </div>
                    </div>
                    <button
                      className="btn-secondary btn-sm"
                      onClick={() => downloadStudentReport(s)}
                      disabled={downloading === s._id}
                      title="Student Report Download"
                    >
                      {downloading === s._id
                        ? <div className="spinner spinner-sm" />
                        : <><Icon name="download" size={14} /> Excel</>
                      }
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
