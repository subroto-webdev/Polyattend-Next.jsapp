'use client';
import React, { useState, useEffect } from 'react';
import api from '@/utils/api';
import Icon from '@/components/common/Icon';
import toast from 'react-hot-toast';

export function TeacherSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    api.get('/sessions').then(r => setSessions(r.data.sessions))
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  const viewSession = async (s) => {
    setSelected(s);
    const res = await api.get(`/attendance/session/${s._id}`);
    setAttendance(res.data.attendance);
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="action-bar">
        <Icon name="clipboard" size={18} style={{ color: 'var(--txt2)' }} />
        <span className="action-bar-title">Past Sessions</span>
      </div>
      <div className="page" style={{ paddingTop: 8 }}>
        {selected ? (
          <>
            <button className="btn-secondary btn-sm mb-3" onClick={() => setSelected(null)}>
              <Icon name="chevronLeft" size={14} /> Back
            </button>
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{selected.subjectId?.name}</div>
              <div style={{ fontSize: 13, color: 'var(--txt2)' }}>
                {selected.departmentId?.name} • Sem {selected.semester} {selected.section} • {new Date(selected.date).toLocaleDateString('en-BD')}
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <span className="tag tag-green">{selected.presentCount} Present</span>
                <span className="tag tag-red">{selected.totalStudents - selected.presentCount} Absent</span>
                <span className="tag tag-blue">{selected.totalStudents ? Math.round(selected.presentCount / selected.totalStudents * 100) : 0}%</span>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Student ID</th><th>Name</th><th>Status</th><th>Time</th></tr></thead>
                <tbody>
                  {attendance.map(a => (
                    <tr key={a._id}>
                      <td style={{ fontSize: 12, fontFamily: 'monospace' }}>{a.studentId?.studentId}</td>
                      <td>{a.studentId?.name}</td>
                      <td><span className={`tag tag-${a.status === 'present' ? 'green' : 'red'}`}>{a.status}</span></td>
                      <td style={{ fontSize: 12 }}>{a.scannedAt ? new Date(a.scannedAt).toLocaleTimeString('en-BD') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="card">
            {sessions.length === 0 ? <div className="empty"><p>কোনো session নেই</p></div> : sessions.map(s => (
              <div key={s._id} className="list-item" onClick={() => viewSession(s)}>
                <div className="item-icon icon-green"><Icon name="check" size={18} /></div>
                <div className="item-content">
                  <div className="item-title">{s.subjectId?.name} — Sem {s.semester} {s.section}</div>
                  <div className="item-sub">{s.departmentId?.name} • {new Date(s.date).toLocaleDateString('en-BD')}</div>
                </div>
                <div className="item-right">
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.presentCount}/{s.totalStudents}</div>
                  <div className="text-xs text-muted">{s.totalStudents ? Math.round(s.presentCount / s.totalStudents * 100) : 0}%</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function TeacherExport() {
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/sessions').then(r => setSessions(r.data.sessions));
  }, []);

  const downloadClass = async (sessionId) => {
    try {
      const res = await api.get(`/reports/class/${sessionId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = `attendance_${sessionId}.xlsx`; a.click();
      toast.success('Downloaded!');
    } catch { toast.error('Failed'); }
  };

  const downloadStudent = async (studentId) => {
    try {
      const res = await api.get(`/reports/student/${studentId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = `student_report.xlsx`; a.click();
      toast.success('Downloaded!');
    } catch { toast.error('Failed'); }
  };

  const searchStudents = async () => {
    if (!studentSearch.trim()) return;
    const res = await api.get('/users', { params: { role: 'student', search: studentSearch } });
    setStudents(res.data.users);
  };

  return (
    <div>
      <div className="action-bar">
        <Icon name="excel" size={18} style={{ color: 'var(--txt2)' }} />
        <span className="action-bar-title">Excel Export</span>
      </div>
      <div className="page" style={{ paddingTop: 8 }}>
        <div className="section-title">Class Session Reports</div>
        <div className="info-banner mb-3">
          <Icon name="info" size={16} />
          <span className="info-text">প্রতিটি session-এর পাশে download বাটন চাপুন</span>
        </div>
        <div className="card mb-3">
          {sessions.map(s => (
            <div key={s._id} className="list-item">
              <div className="item-icon icon-green"><Icon name="clipboard" size={18} /></div>
              <div className="item-content">
                <div className="item-title">{s.subjectId?.name} — {s.section}</div>
                <div className="item-sub">{new Date(s.date).toLocaleDateString('en-BD')} • {s.presentCount}/{s.totalStudents}</div>
              </div>
              <button className="btn-secondary btn-sm" onClick={() => downloadClass(s._id)}>
                <Icon name="download" size={14} />
              </button>
            </div>
          ))}
          {sessions.length === 0 && <div className="empty"><p>কোনো session নেই</p></div>}
        </div>

        <div className="section-title">Student Report</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input className="form-input" placeholder="Student নাম বা ID..." value={studentSearch}
            onChange={e => setStudentSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchStudents()}
            style={{ flex: 1 }} />
          <button className="btn-secondary" onClick={searchStudents}><Icon name="search" size={16} /></button>
        </div>
        <div className="card">
          {students.map(s => (
            <div key={s._id} className="list-item">
              <div className="item-icon icon-amber"><Icon name="users" size={18} /></div>
              <div className="item-content">
                <div className="item-title">{s.name}</div>
                <div className="item-sub">{s.studentId}</div>
              </div>
              <button className="btn-secondary btn-sm" onClick={() => downloadStudent(s._id)}>
                <Icon name="download" size={14} />
              </button>
            </div>
          ))}
          {students.length === 0 && <div className="empty"><Icon name="search" size={32} /><p>Student খুঁজুন</p></div>}
        </div>
      </div>
    </div>
  );
}

export default TeacherSessions;
