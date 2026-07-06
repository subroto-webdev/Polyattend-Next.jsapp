'use client';
import React, { useState, useEffect } from 'react';
import api from '@/utils/api';
import Icon from '@/components/common/Icon';
import toast from 'react-hot-toast';

export default function AdminReports() {
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('subject');

  useEffect(() => {
    Promise.all([api.get('/subjects'), api.get('/sessions'), api.get('/users?role=student')])
      .then(([s, se, st]) => { setSubjects(s.data.subjects || []); setSessions(se.data.sessions || []); setStudents(st.data.users || []); })
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  const downloadSubject = async subjectId => {
    try {
      const res = await api.get(`/reports/subject/${subjectId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = `subject_report.xlsx`; a.click();
      toast.success('Download শুরু!');
    } catch { toast.error('Download failed'); }
  };
  const downloadSession = async sessionId => {
    try {
      const res = await api.get(`/reports/class/${sessionId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = `session_report.xlsx`; a.click();
      toast.success('Download শুরু!');
    } catch { toast.error('Download failed'); }
  };
  const downloadStudent = async studentId => {
    try {
      const res = await api.get(`/reports/student/${studentId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = `student_report.xlsx`; a.click();
      toast.success('Download শুরু!');
    } catch { toast.error('Download failed'); }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Reports & Export</h2>
        <p className="page-sub">Excel রিপোর্ট download করুন</p>
      </div>

      <div className="chips" style={{ background: 'none', border: 'none', padding: '0 0 16px 0' }}>
        {[['subject','Subject Reports'],['session','Session Reports'],['student','Student Reports']].map(([k,l]) => (
          <button key={k} className={`chip${tab===k?' active':''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === 'subject' && (
        <>
          <div className="section-title">Subject-wise Full Report</div>
          <div className="card">
            {subjects.length === 0 ? <div className="empty"><p>কোনো subject নেই</p></div>
              : subjects.map(s => (
                <div key={s._id} className="list-item">
                  <div className="item-icon icon-green"><Icon name="book" size={18} /></div>
                  <div className="item-content">
                    <div className="item-title">{s.name} ({s.code})</div>
                    <div className="item-sub">{s.departmentId?.name} • Sem {s.semester} • Sec {s.section}</div>
                  </div>
                  <button className="btn-secondary btn-sm" onClick={() => downloadSubject(s._id)}>
                    <Icon name="download" size={14} /> Excel
                  </button>
                </div>
              ))}
          </div>
        </>
      )}

      {tab === 'session' && (
        <>
          <div className="section-title">Session-wise Report</div>
          <div className="card">
            {sessions.length === 0 ? <div className="empty"><p>কোনো session নেই</p></div>
              : sessions.map(s => (
                <div key={s._id} className="list-item">
                  <div className="item-icon icon-blue"><Icon name="calendar" size={18} /></div>
                  <div className="item-content">
                    <div className="item-title">{s.subjectId?.name} — Sec {s.section}</div>
                    <div className="item-sub">{new Date(s.date).toLocaleDateString()} • {s.presentCount}/{s.totalStudents}</div>
                  </div>
                  <button className="btn-secondary btn-sm" onClick={() => downloadSession(s._id)}>
                    <Icon name="download" size={14} /> Excel
                  </button>
                </div>
              ))}
          </div>
        </>
      )}

      {tab === 'student' && (
        <>
          <div className="section-title">Student Personal Report</div>
          <div className="card">
            {students.length === 0 ? <div className="empty"><p>কোনো student নেই</p></div>
              : students.map(s => (
                <div key={s._id} className="list-item">
                  <div className="item-icon icon-amber"><Icon name="users" size={18} /></div>
                  <div className="item-content">
                    <div className="item-title">{s.name}</div>
                    <div className="item-sub">{s.studentId} • {s.departmentId?.name} • Sem {s.semester} Sec {s.section}</div>
                  </div>
                  <button className="btn-secondary btn-sm" onClick={() => downloadStudent(s._id)}>
                    <Icon name="download" size={14} /> Excel
                  </button>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
