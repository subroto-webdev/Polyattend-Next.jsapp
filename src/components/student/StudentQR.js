'use client';
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Icon from '@/components/common/Icon';

export default function StudentQR() {
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    if (!user?.qrCode) return;
    setDownloading(true);

    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Attendance QR Card', W / 2, 80);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(130, 110, 240, 240);
      ctx.drawImage(img, 130, 110, 240, 240);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(user.name, W / 2, 390);

      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '14px monospace';
      ctx.fillText(user.studentId, W / 2, 415);

      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '13px sans-serif';
      ctx.fillText(`${user.departmentId?.name} | Sem ${user.semester} | Sec ${user.section}`, W / 2, 445);

      const link = document.createElement('a');
      link.download = `QR_${user.name}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setDownloading(false);
    };
    img.onerror = () => setDownloading(false);
    img.src = user.qrCode;
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">My QR Code</h2>
        <p className="page-sub">Teacher-কে এই QR code স্ক্যান করতে দিন</p>
      </div>

      <div className="card" style={{ padding: 28, textAlign: 'center' }}>
        {user?.qrCode ? (
          <>
            <img
              src={user.qrCode}
              alt="My QR Code"
              style={{ width: 220, height: 220, border: '4px solid var(--primary)', borderRadius: 12, margin: '0 auto 16px', display: 'block' }}
            />
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{user.name}</div>
            <div style={{ fontSize: 13, color: 'var(--txt2)', fontFamily: 'monospace', marginBottom: 16 }}>{user.studentId}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              <span className="tag tag-green">{user.departmentId?.name}</span>
              <span className="tag tag-blue">Sem {user.semester}</span>
              <span className="tag tag-amber">Sec {user.section}</span>
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleDownload} disabled={downloading}>
              <Icon name="download" size={16} />
              {downloading ? 'তৈরি হচ্ছে...' : 'QR Card Download করুন'}
            </button>
          </>
        ) : (
          <div className="empty">
            <div className="empty-icon"><Icon name="qr" size={24} /></div>
            <p>QR code পাওয়া যায়নি। Admin-কে জানান।</p>
          </div>
        )}
      </div>

      <div className="info-banner" style={{ marginTop: 16 }}>
        <Icon name="info" size={16} />
        <span className="info-text">
          Class-এ উপস্থিতির সময় teacher এই QR code স্ক্যান করবেন। Phone উজ্জ্বল রাখুন।
        </span>
      </div>
    </div>
  );
}