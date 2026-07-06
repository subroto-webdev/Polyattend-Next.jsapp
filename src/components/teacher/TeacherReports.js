'use client';
import React, { useState, useEffect } from 'react';
import api from '@/utils/api';
import Icon from '@/components/common/Icon';
import toast from 'react-hot-toast';

export default function TeacherReports() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [report, setReport] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  useEffect(() => {
    api.get('/subjects').then(r => setSubjects(r.data.subjects || [])).finally(() => setLoadingSubjects(false));
  }, []);

  const loadReport = async (subject) => {
    setSelectedSubject(subject);
    setLoading(true);
    try {
      const res = await api.get(`/attendance/subject/${subject._id}`);
      setReport(res.data.report);
      setSessions(res.data.sessions);
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  const downloadSubjectReport = async (subjectId) => {
    try {
      const res = await api.get(`/reports/subject/${subjectId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = `subject_report.xlsx`; a.click();
      toast.success('Report download শুরু হয়েছে!');
    } catch (err) { toast.error('Download failed'); }
  };

  const downloadStudentReport = async (studentId) => {
    try {
      const res = await api.get(`/reports/student/${studentId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = `student_report.xlsx`; a.click();
      toast.success('Student report download হচ্ছে!');
    } catch (err) { toast.error('Download failed'); }
  };

  const downloadSessionReport = async (sessionId) => {
    try {
      const res = await api.get(`/reports/class/${sessionId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = `session_report.xlsx`; a.click();
      toast.success('Session report download হচ্ছে!');
    } catch (err) { toast.error('Download failed'); }
  };

  if (loadingSubjects) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Attendance Reports</h2>
        <p className="page-sub">Subject-wise attendance দেখুন ও Excel এ download করুন</p>
      </div>

      {!selectedSubject ? (
        <>
          <div className="section-title">Subject বেছে নিন</div>
          {subjects.length === 0 ? (
            <div className="card"><div className="empty"><p>কোনো subject নেই</p></div></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {subjects.map(s => (
                <div key={s._id} className="subject-card" onClick={() => loadReport(s)}>
                  <div className="subject-code">{s.code}</div>
                  <div className="subject-name">{s.name}</div>
                  <div className="subject-meta">{s.departmentId?.name} • Sem {s.semester} • Sec {s.section}</div>
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--info)', fontSize: 13, fontWeight: 600 }}>
                    <Icon name="eye" size={14} /> Report দেখুন
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button className="btn-secondary btn-sm" onClick={() => { setSelectedSubject(null); setReport(null); }}>
              <Icon name="chevronLeft" size={14} /> Back
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{selectedSubject.name} ({selectedSubject.code})</div>
              <div style={{ fontSize: 12, color: 'var(--txt2)' }}>{selectedSubject.departmentId?.name} • Sem {selectedSubject.semester} • Sec {selectedSubject.section}</div>
            </div>
            <button className="btn-secondary btn-sm" onClick={() => downloadSubjectReport(selectedSubject._id)}>
              <Icon name="download" size={14} /> Full Excel
            </button>
          </div>

          {loading ? <div className="loading"><div className="spinner" /></div> : !report ? null : (
            <>
              <div className="stats-grid" style={{ marginBottom: 16 }}>
                <div className="stat-card stat-blue">
                  <div className="stat-val">{sessions.length}</div>
                  <div className="stat-lbl">Total Classes</div>
                </div>
                <div className="stat-card stat-green">
                  <div className="stat-val">{report.length}</div>
                  <div className="stat-lbl">Students</div>
                </div>
                <div className="stat-card stat-amber">
                  <div className="stat-val">
                    {report.length ? Math.round(report.reduce((s, r) => s + r.percentage, 0) / report.length) : 0}%
                  </div>
                  <div className="stat-lbl">Class Avg</div>
                </div>
                <div className="stat-card stat-red">
                  <div className="stat-val">{report.filter(r => r.percentage < 75).length}</div>
                  <div className="stat-lbl">Below 75%</div>
                </div>
              </div>

              <div className="section-title">Student-wise Attendance</div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student</th>
                      <th>ID</th>
                      <th>Total</th>
                      <th>Present</th>
                      <th>Absent</th>
                      <th>%</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.map((r, i) => (
                      <tr key={r.student._id}>
                        <td>{i + 1}</td>
                        <td style={{ fontWeight: 500 }}>{r.student.name}</td>
                        <td><code style={{ fontSize: 11 }}>{r.student.studentId}</code></td>
                        <td>{r.total}</td>
                        <td><span className="att-p">{r.present}</span></td>
                        <td><span className="att-a">{r.absent}</span></td>
                        <td>
                          <span style={{ fontWeight: 700, color: r.percentage >= 75 ? 'var(--primary)' : r.percentage >= 60 ? 'var(--accent)' : 'var(--danger)' }}>
                            {r.percentage}%
                          </span>
                        </td>
                        <td>
                          <button className="btn-icon" title="Download Student Report" onClick={() => downloadStudentReport(r.student._id)}>
                            <Icon name="download" size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {sessions.length > 0 && (
                <>
                  <div className="section-title" style={{ marginTop: 20 }}>Sessions</div>
                  <div className="card">
                    {sessions.map(s => (
                      <div key={s._id} className="list-item" style={{ cursor: 'default' }}>
                        <div className="item-icon icon-blue"><Icon name="calendar" size={18} /></div>
                        <div className="item-content">
                          <div className="item-title">{new Date(s.date).toLocaleDateString('en-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                          <div className="item-sub">{s.presentCount}/{s.totalStudents} present</div>
                        </div>
                        <button className="btn-icon" title="Download" onClick={() => downloadSessionReport(s._id)}>
                          <Icon name="download" size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
