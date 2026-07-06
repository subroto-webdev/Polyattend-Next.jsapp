'use client';
import React, { useState, useEffect } from 'react';
import api from '@/utils/api';
import Icon from '@/components/common/Icon';
import { useAuth } from '@/context/AuthContext';
import SessionCheckIn from './SessionCheckIn';

export default function StudentHome() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?._id) {
      api.get(`/attendance/student/${user._id}`)
        .then(r => setSummary(r.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const overall = summary?.overall || {};
  const lowAtt = summary?.summary?.filter(s => s.percentage < 75) || [];

  return (
    <div className="page">
      {/* Auto-appears the moment a teacher starts a session for this student's class */}
      <SessionCheckIn />

      {/* Profile Card */}
      <div className="profile-card">
        <div className="profile-avatar">{user?.name?.charAt(0)}</div>
        <div>
          <div className="profile-name">{user?.name}</div>
          <div className="profile-meta">
            {user?.studentId} • {user?.departmentId?.name} • Sem {user?.semester} • Sec {user?.section}
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-green">
          <div className="stat-icon"><Icon name="chart" size={18} /></div>
          <div className="stat-val">{overall.percentage || 0}%</div>
          <div className="stat-lbl">Overall Att.</div>
        </div>
        <div className="stat-card stat-blue">
          <div className="stat-icon"><Icon name="book" size={18} /></div>
          <div className="stat-val">{summary?.summary?.length || 0}</div>
          <div className="stat-lbl">Subjects</div>
        </div>
        <div className="stat-card stat-amber">
          <div className="stat-icon"><Icon name="check" size={18} /></div>
          <div className="stat-val">{overall.present || 0}</div>
          <div className="stat-lbl">Present</div>
        </div>
        <div className="stat-card stat-red">
          <div className="stat-icon"><Icon name="alert" size={18} /></div>
          <div className="stat-val">{lowAtt.length}</div>
          <div className="stat-lbl">Below 75%</div>
        </div>
      </div>

      {lowAtt.length > 0 && (
        <div className="info-banner warn-banner mb-3">
          <Icon name="alert" size={16} />
          <span className="info-text">
            <strong>{lowAtt.length}টি subject</strong>-এ attendance 75%-এর নিচে। এখনই উপস্থিত থাকুন!
          </span>
        </div>
      )}

      <div className="section-title">Subject-wise Attendance</div>
      <div className="card mb-3">
        {(summary?.summary || []).length === 0 ? (
          <div className="empty"><p>কোনো attendance record নেই এখনও।</p></div>
        ) : (summary?.summary || []).map((s, i) => {
          const pct = s.percentage;
          const color = pct >= 75 ? 'var(--primary)' : pct >= 60 ? 'var(--accent)' : 'var(--danger)';
          const fillClass = pct >= 75 ? 'fill-green' : pct >= 60 ? 'fill-amber' : 'fill-red';
          return (
            <div key={i} style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)' }}>
              <div className="progress-row">
                <span className="progress-label">{s.subject?.name}</span>
                <span style={{ fontSize: 12, color, fontWeight: 700 }}>
                  {s.present}/{s.total} ({pct}%)
                </span>
              </div>
              <div className="progress-bg">
                <div className={`progress-fill ${fillClass}`} style={{ width: `${pct}%` }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 4 }}>
                {s.subject?.code} • {s.present} present, {s.absent} absent
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
