'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/utils/api';
import Icon from '@/components/common/Icon';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getPasswordStrength(pw) {
  if (!pw) return null;
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: 'দুর্বল Password', color: '#ef4444', width: '34%' };
  if (score <= 3) return { label: 'মাঝারি Password', color: '#f59e0b', width: '67%' };
  return { label: 'শক্তিশালী Password', color: '#22c55e', width: '100%' };
}

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState('student');
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    shift: '', studentId: '', departmentId: '', semester: '', section: '',
    secretKey: ''
  });

  // ছোট derived values — শুধুমাত্র UI hint/animation এর জন্য, submit validation যেমন ছিল তেমনই আছে
  const nameValid = form.name.trim().length > 0;
  const emailValid = EMAIL_REGEX.test(form.email);
  const passwordValid = form.password.length >= 6;
  const strength = getPasswordStrength(form.password);

  useEffect(() => {
    api.get('/departments/public').then(res => setDepartments(res.data.departments || [])).catch(() => { });
  }, []);

  const set = field => e => setForm(p => ({ ...p, [field]: e.target.value }));
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Name, Email ও Password আবশ্যক');
    if (!EMAIL_REGEX.test(form.email)) return toast.error('সঠিক Email ঠিকানা দিন');
    if (form.password.length < 6) return toast.error('Password কমপক্ষে ৬ অক্ষর হতে হবে');
    if (role === 'teacher') {
      if (!form.shift) return toast.error('Shift দিন');
      if (!form.secretKey) return toast.error('Teacher Secret Key দিন'); // শুধু empty check
    }
    if (role === 'student' && (!form.studentId || !form.departmentId || !form.semester || !form.section || !form.shift)) {
      return toast.error('Student ID, Department, Semester, Group ও Shift দিন');
    }
    setLoading(true);
    try {
      await api.post('/auth/register-public', { ...form, role });
      toast.success('Registration সফল! Email verify করুন 📧');
      router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed'); // backend error এখানে দেখাবে
    } finally { setLoading(false); }
  };

  const ShiftSelector = () => (
    <div className="form-group">
      <label className="form-label">Shift *</label>
      <div style={{ display: 'flex', gap: 10 }}>
        {[
          { value: '1st', label: '🌅 1st Shift' },
          { value: '2nd', label: '🌙 2nd Shift' }
        ].map(s => {
          const selected = form.shift === s.value;
          return (
            <button
              key={s.value}
              type="button"
              className={`rp-toggle-btn${selected ? ' is-selected' : ''}`}
              onClick={() => setForm(p => ({ ...p, shift: s.value }))}
              style={{
                flex: 1, padding: '12px 10px', borderRadius: 10,
                border: selected ? '2px solid var(--primary)' : '2px solid var(--border2)',
                background: selected ? 'var(--primary-light)' : 'var(--bg)',
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center'
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: selected ? 'var(--primary)' : 'var(--txt)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {s.label}
                {selected && <span className="rp-check">✓</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="auth-page rp-page" style={{ alignItems: 'flex-start', paddingTop: 24, paddingBottom: 24 }}>
      <style>{`
        @keyframes rpFadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes rpFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes rpPopIn { from { opacity: 0; transform: scale(0.4); } to { opacity: 1; transform: scale(1); } }
        @keyframes rpSlideDown { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes rpShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

        .rp-card-animate { animation: rpFadeUp .55s cubic-bezier(.16,1,.3,1) both; }
        .rp-logo-float { animation: rpFloat 3.2s ease-in-out infinite; }
        .rp-anim-field { animation: rpFadeUp .45s cubic-bezier(.16,1,.3,1) both; }
        .rp-section-enter { animation: rpFadeUp .4s cubic-bezier(.16,1,.3,1) both; }
        .rp-inline-error { animation: rpSlideDown .25s ease both; }

        .rp-check {
          display: inline-flex; align-items: center; justify-content: center;
          color: #22c55e; font-weight: 700; line-height: 1;
          animation: rpPopIn .3s cubic-bezier(.34,1.56,.64,1) both;
        }

        .rp-toggle-btn, .rp-role-btn {
          transition: transform .22s cubic-bezier(.34,1.56,.64,1), border-color .22s ease, background .22s ease, box-shadow .22s ease;
        }
        .rp-toggle-btn:hover, .rp-role-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 18px -10px rgba(0,0,0,0.28); }
        .rp-toggle-btn.is-selected, .rp-role-btn.is-selected { transform: scale(1.02); }
        .rp-toggle-btn:active, .rp-role-btn:active { transform: scale(0.97); }

        .rp-input-wrap { position: relative; }
        .rp-eye-btn { transition: transform .2s ease, color .2s ease; }
        .rp-eye-btn:hover { color: var(--primary); }
        .rp-eye-spin { display: inline-flex; transition: transform .35s ease; }

        .rp-strength-track { height: 5px; border-radius: 4px; background: var(--border2); overflow: hidden; margin-top: 6px; }
        .rp-strength-bar { height: 100%; border-radius: 4px; transition: width .35s cubic-bezier(.16,1,.3,1), background-color .35s ease; }

        .rp-submit { position: relative; overflow: hidden; transition: transform .2s ease, box-shadow .2s ease, filter .2s ease; }
        .rp-submit:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 12px 24px -12px var(--primary); filter: brightness(1.05); }
        .rp-submit:not(:disabled):active { transform: translateY(0) scale(0.98); }
        .rp-submit::after {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%);
          background-size: 200% 100%; background-position: -200% 0;
        }
        .rp-submit:not(:disabled):hover::after { animation: rpShimmer 1.1s ease; }

        .rp-login-link { position: relative; text-decoration: none; }
        .rp-login-link::after {
          content: ''; position: absolute; left: 0; bottom: -2px; width: 0; height: 1px;
          background: var(--primary); transition: width .25s ease;
        }
        .rp-login-link:hover::after { width: 100%; }

        @media (prefers-reduced-motion: reduce) {
          .rp-card-animate, .rp-logo-float, .rp-anim-field, .rp-section-enter,
          .rp-check, .rp-inline-error, .rp-toggle-btn, .rp-role-btn,
          .rp-submit::after, .rp-eye-spin, .rp-strength-bar, .rp-login-link::after {
            animation: none !important; transition: none !important;
          }
        }
      `}</style>

      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />

      <div className="auth-card rp-card-animate" style={{ maxWidth: 420 }}>
        <div className="auth-logo">
          <div className="auth-logo-icon rp-logo-float"><Icon name="school" size={28} /></div>
          <h1 className="auth-title">নতুন Account</h1>
          <p className="auth-sub">PolyAttend-এ যোগ দিন</p>
        </div>

        {/* Role Selector */}
        <div className="rp-anim-field" style={{ display: 'flex', gap: 10, marginBottom: 20, animationDelay: '0ms' }}>
          {[
            { value: 'student', label: '🎓 Student', sub: 'Class attendance দেখুন' },
            { value: 'teacher', label: '👨‍🏫 Teacher', sub: 'Attendance নিন' },
          ].map(r => {
            const selected = role === r.value;
            return (
              <button key={r.value} type="button"
                className={`rp-role-btn${selected ? ' is-selected' : ''}`}
                onClick={() => { setRole(r.value); setForm(p => ({ ...p, shift: '', secretKey: '' })); }}
                style={{
                  flex: 1, padding: '10px 12px', textAlign: 'left',
                  border: `2px solid ${selected ? 'var(--primary)' : 'var(--border2)'}`,
                  borderRadius: 10,
                  background: selected ? 'var(--primary-light)' : 'var(--bg)',
                  cursor: 'pointer', fontFamily: 'inherit'
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: selected ? 'var(--primary)' : 'var(--txt)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {r.label}
                  {selected && <span className="rp-check">✓</span>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>{r.sub}</div>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group rp-anim-field" style={{ animationDelay: '60ms' }}>
            <label className="form-label">পূর্ণ নাম *</label>
            <div className="rp-input-wrap">
              <input className="form-input" placeholder="আপনার পূর্ণ নাম" value={form.name} onChange={set('name')} required style={{ paddingRight: 36 }} />
              {nameValid && <span className="rp-check" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>✓</span>}
            </div>
          </div>

          <div className="form-group rp-anim-field" style={{ animationDelay: '120ms' }}>
            <label className="form-label">Email *</label>
            <div className="rp-input-wrap">
              <input
                className="form-input"
                type="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={set('email')}
                required
                style={{ paddingRight: 36 }}
              />
              {form.email && emailValid && (
                <span className="rp-check" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>✓</span>
              )}
            </div>
            {form.email && !emailValid && (
              <span className="rp-inline-error" style={{ color: 'red', fontSize: '13px', marginTop: '4px', display: 'block' }}>
                সঠিক Email ঠিকানা দিন
              </span>
            )}
          </div>

          <div className="form-group rp-anim-field" style={{ animationDelay: '180ms' }}>
            <label className="form-label">Password *</label>
            <div className="rp-input-wrap">
              <input
                className="form-input"
                type={showPass ? 'text' : 'password'}
                placeholder="কমপক্ষে ৬ অক্ষর"
                value={form.password}
                onChange={set('password')}
                required
                style={{ paddingRight: 68 }}
              />
              {passwordValid && (
                <span className="rp-check" style={{ position: 'absolute', right: 42, top: '50%', transform: 'translateY(-50%)' }}>✓</span>
              )}
              <button type="button" className="rp-eye-btn" onClick={() => setShowPass(p => !p)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt3)' }}>
                <span className="rp-eye-spin" style={{ transform: showPass ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                  <Icon name="eye" size={16} />
                </span>
              </button>
            </div>
            {strength && (
              <>
                <div className="rp-strength-track">
                  <div className="rp-strength-bar" style={{ width: strength.width, background: strength.color }} />
                </div>
                <div style={{ fontSize: 11, color: strength.color, marginTop: 4, fontWeight: 600 }}>{strength.label}</div>
              </>
            )}
          </div>

          {/* Teacher Section */}
          {role === 'teacher' && (
            <div key="teacher-section" className="rp-section-enter">
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '14px 0' }} />
              <div style={{ fontSize: 18, fontWeight: 600, color: '#4ade80', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>Teacher Information</div>
              <ShiftSelector />
              {/* ✅ Secret Key Field */}
              <div className="form-group">
                <label className="form-label">Teacher Secret Key *</label>
                <div className="rp-input-wrap">
                  <input
                    className="form-input"
                    type={showSecretKey ? 'text' : 'password'}
                    placeholder="Admin প্রদত্ত Secret Key"
                    value={form.secretKey}
                    onChange={set('secretKey')}
                    required
                    style={{ paddingRight: 42 }}
                  />
                  <button type="button" className="rp-eye-btn" onClick={() => setShowSecretKey(p => !p)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt3)' }}>
                    <span className="rp-eye-spin" style={{ transform: showSecretKey ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                      <Icon name="eye" size={16} />
                    </span>
                  </button>
                </div>
                <span style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 4, display: 'block' }}>
                  🔐 শুধুমাত্র অনুমোদিত Teacher রা register করতে পারবেন
                </span>
              </div>
            </div>
          )}

          {/* Student Section */}
          {role === 'student' && (
            <div key="student-section" className="rp-section-enter">
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '14px 0' }} />
              <div style={{ fontSize: 18, fontWeight: 600, color: '#4ade80', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>Student Information</div>
              <div className="form-group">
                <label className="form-label">Student Roll</label>
                <input className="form-input" placeholder="যেমন: 800768" value={form.studentId} onChange={set('studentId')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Department *</label>
                <select className="form-select" value={form.departmentId} onChange={set('departmentId')} required>
                  <option value="">-- Department বেছে নিন --</option>
                  {departments.map(d => <option key={d._id} value={d._id}>{d.name} ({d.code})</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Semester *</label>
                  <select className="form-select" value={form.semester} onChange={set('semester')} required>
                    <option value="">--</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>{s}th Sem</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Group *</label>
                  <select className="form-select" value={form.section} onChange={set('section')} required>
                    <option value="">--</option>
                    {['A', 'B', 'C', 'D'].map(s => <option key={s} value={s}>Group {s}</option>)}
                  </select>
                </div>
              </div>
              <ShiftSelector />
            </div>
          )}

          <button className="btn-primary rp-submit" type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? <><div className="spinner spinner-sm" /> Registration হচ্ছে...</> : 'Register করুন →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--txt2)' }}>
          আগেই account আছে?{' '}
          <Link href="/login" className="rp-login-link" style={{ color: 'var(--primary)', fontWeight: 600 }}>Login করুন</Link>
        </p>
      </div>
    </div>
  );
}