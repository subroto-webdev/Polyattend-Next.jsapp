'use client';
import React, { useState, useEffect } from 'react';
import api from '@/utils/api';
import Icon from '@/components/common/Icon';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/subjects'),
      api.get('/sessions?status=ended')
    ]).then(([s, sess]) => {
      setSubjects(s.data.subjects || []);
      setSessions(sess.data.sessions?.slice(0, 5) || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const totalPresent = sessions.reduce((s, r) => s + (r.presentCount || 0), 0);
  const totalStudents = sessions.reduce((s, r) => s + (r.totalStudents || 0), 0);
  const avgAtt = totalStudents ? Math.round(totalPresent / totalStudents * 100) : 0;

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">স্বাগতম, {user?.name?.split(' ')[0]}! 👋</h2>
        <p className="page-sub">আজকে কোন class নেবেন? নিচে subject select করুন।</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-green">
          <div className="stat-icon"><Icon name="book" size={18} /></div>
          <div className="stat-val">{subjects.length}</div>
          <div className="stat-lbl">My Subjects</div>
        </div>
        <div className="stat-card stat-blue">
          <div className="stat-icon"><Icon name="clipboard" size={18} /></div>
          <div className="stat-val">{sessions.length}</div>
          <div className="stat-lbl">Sessions Taken</div>
        </div>
        <div className="stat-card stat-amber">
          <div className="stat-icon"><Icon name="chart" size={18} /></div>
          <div className="stat-val">{avgAtt}%</div>
          <div className="stat-lbl">Avg Attendance</div>
        </div>
        <div className="stat-card stat-purple">
          <div className="stat-icon"><Icon name="users" size={18} /></div>
          <div className="stat-val">{[...new Set(subjects.map(s => `${s.semester}-${s.section}`))].length}</div>
          <div className="stat-lbl">Classes</div>
        </div>
      </div>

      <div className="section-title">আমার Subjects</div>
      {subjects.length === 0 ? (
        <div className="card">
          <div className="empty">
            <div className="empty-icon"><Icon name="book" size={24} /></div>
            <p>কোনো subject নেই। "Subjects" থেকে নতুন subject তৈরি করুন।</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 24 }}>
          {subjects.map(s => (
            <div key={s._id} className="card" style={{ padding: '14px 16px' }}>
              <div className="subject-code">{s.code}</div>
              <div className="subject-name">{s.name}</div>
              <div className="subject-meta">{s.departmentId?.name} • Semester {s.semester} • Section {s.section}</div>
            </div>
          ))}
        </div>
      )}

      {sessions.length > 0 && (
        <>
          <div className="section-title">সাম্প্রতিক Sessions</div>
          <div className="card">
            {sessions.map(s => (
              <div key={s._id} className="list-item" style={{ cursor: 'default' }}>
                <div className="item-icon icon-green"><Icon name="check" size={18} /></div>
                <div className="item-content">
                  <div className="item-title">{s.subjectId?.name} — Sec {s.section}</div>
                  <div className="item-sub">{s.departmentId?.name} • {new Date(s.date).toLocaleDateString('en-BD')}</div>
                </div>
                <div className="item-right">
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.presentCount}/{s.totalStudents}</div>
                  <div className="text-xs text-muted">{s.totalStudents ? Math.round(s.presentCount / s.totalStudents * 100) : 0}%</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
