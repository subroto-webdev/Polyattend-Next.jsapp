'use client';
import React, { useState } from 'react';
import api from '@/utils/api';
import Icon from '@/components/common/Icon';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function StudentReport() {
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(false);

  const downloadReport = async () => {
    setDownloading(true);
    try {
      const res = await api.get(`/reports/student/${user._id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${user.studentId || user.name}.xlsx`;
      a.click();
      toast.success('Report download শুরু হয়েছে!');
    } catch (err) {
      toast.error('Download failed');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">My Report</h2>
        <p className="page-sub">Excel ফরম্যাটে attendance report download করুন</p>
      </div>

      <div className="card" style={{ padding: 24, textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'var(--primary-light)', color: 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <Icon name="download" size={30} />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Personal Attendance Report</h3>
        <p style={{ color: 'var(--txt2)', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
          আপনার সমস্ত subject-এর attendance, তারিখ ভিত্তিক রেকর্ড, এবং পরিসংখ্যান সহ Excel রিপোর্ট।
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, maxWidth: 300, margin: '0 auto 24px', textAlign: 'left' }}>
          {[
            'Subject-wise summary',
            'Date-wise records',
            'Total/Present/Absent',
            'Attendance percentage',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--txt2)' }}>
              <Icon name="check" size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              {item}
            </div>
          ))}
        </div>

        <button className="btn-primary" style={{ maxWidth: 260, margin: '0 auto' }} onClick={downloadReport} disabled={downloading}>
          {downloading
            ? <><div className="spinner spinner-sm" /> Generating...</>
            : <><Icon name="download" size={16} /> Excel Report Download</>
          }
        </button>
      </div>

      <div className="info-banner" style={{ marginTop: 16 }}>
        <Icon name="info" size={16} />
        <span className="info-text">
          Report-এ দুটি sheet থাকবে: <strong>Subject Summary</strong> ও <strong>Date-wise Records</strong>।
        </span>
      </div>
    </div>
  );
}
