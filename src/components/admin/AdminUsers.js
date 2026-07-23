'use client';
import React, { useState, useEffect, useMemo } from 'react';
import api from '@/utils/api';
import Icon from '@/components/common/Icon';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [currentUser, setCurrentUser] = useState(null); // Add this

  // ── FIX (grouping request): group students by Section wherever the list
  // shows one, instead of a flat list. Teachers/admins don't have a Section,
  // so they're grouped together separately.
  const groupedUsers = useMemo(() => {
    const withSection = {};
    const noSection = [];
    users.forEach(u => {
      if (u.role === 'student' && u.section) {
        if (!withSection[u.section]) withSection[u.section] = [];
        withSection[u.section].push(u);
      } else {
        noSection.push(u);
      }
    });
    const groups = Object.keys(withSection).sort().map(key => ({ label: `Group: ${key}`, items: withSection[key] }));
    if (noSection.length) groups.push({ label: 'Teacher / Admin', items: noSection });
    return groups;
  }, [users]);

  const load = () => {
    setLoading(true);
    const params = {};
    if (roleFilter !== 'all') params.role = roleFilter;
    if (search) params.search = search;
    api.get('/users', { params }).then(r => setUsers(r.data.users || [])).finally(() => setLoading(false));
  };

  // Add this useEffect to fetch current user
  useEffect(() => {
    api.get('/auth/me').then(r => setCurrentUser(r.data.user));
  }, []);

  useEffect(() => { load(); }, [roleFilter]);

  const handleSearch = (e) => { e.preventDefault(); load(); };

  const toggleActive = async (user) => {
    // Add this validation
    if (currentUser && user._id === currentUser._id) {
      toast.error('আপনি নিজেকে deactivate করতে পারবেন না');
      return;
    }

    try {
      await api.put(`/users/${user._id}`, { isActive: !user.isActive });
      toast.success(user.isActive ? 'User deactivated' : 'User activated');
      load();
    } catch { toast.error('Error'); }
  };

  const roleColor = (role) => role === 'admin' ? 'tag-blue' : role === 'teacher' ? 'tag-green' : 'tag-amber';

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="page-title">Users Management</h2>
          <p className="page-sub">সকল ব্যবহারকারী পরিচালনা করুন</p>
        </div>
        <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700, fontSize: 13, padding: '6px 14px', borderRadius: 20 }}>
          {users.length} জন
        </div>
      </div>

      {/* Filter + Search */}
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '12px 14px', marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
          {['all', 'student', 'teacher', 'admin'].map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              style={{
                padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                background: roleFilter === r ? 'var(--primary)' : 'var(--bg3)',
                color: roleFilter === r ? '#fff' : 'var(--txt2)',
                boxShadow: roleFilter === r ? '0 2px 8px rgba(26,107,74,0.25)' : 'none',
                transform: roleFilter === r ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              {r === 'all' ? 'সবাই' : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--txt3)' }}>
              <Icon name="search" size={14} />
            </span>
            <input
              className="form-input"
              style={{ paddingLeft: 34, width: 180, fontSize: 13 }}
              placeholder="নাম বা ID খুঁজুন"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-secondary btn-sm">
            <Icon name="search" size={14} />
          </button>
        </form>
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : users.length === 0 ? (
        <div className="card">
          <div className="empty">
            <div className="empty-icon"><Icon name="users" size={24} /></div>
            <p>কোনো user নেই</p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="table-wrap" style={{ display: 'none' }} id="desktop-table">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Name</th><th>Email</th><th>Role</th>
                  <th>ID / Dept</th><th>Shift</th><th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let rowNum = 0;
                  return groupedUsers.map(group => (
                    <React.Fragment key={group.label}>
                      <tr>
                        <td colSpan={8} style={{ background: 'var(--bg3)', fontWeight: 700, fontSize: 12, color: 'var(--txt2)', padding: '8px 12px' }}>
                          {group.label}
                        </td>
                      </tr>
                      {group.items.map((u) => {
                        rowNum++;
                        return (
                <tr key={u._id}>
                    <td style={{ color: 'var(--txt3)', fontSize: 12 }}>{rowNum}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--primary-mid))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                          {u.name?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</div>
                          {u.studentId && <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--txt3)' }}>{u.studentId}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--txt2)' }}>{u.email}</td>
                    <td><span className={`tag ${roleColor(u.role)}`}>{u.role}</span></td>
                    <td style={{ fontSize: 12 }}>
                      {u.role === 'student'
                        ? `${u.departmentId?.code || '-'} • Sem ${u.semester} Group ${u.section}`
                        : u.departmentId?.name || '-'}
                    </td>
                    <td>
                      {u.shift ? <span className="tag tag-purple">{u.shift} Shift</span> : <span style={{ color: 'var(--txt3)', fontSize: 12 }}>-</span>}
                    </td>
                    <td>
                      <span className={`tag ${u.isActive ? 'tag-green' : 'tag-red'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-icon"
                        onClick={() => toggleActive(u)}
                        disabled={currentUser && u._id === currentUser._id} // Add this
                        title={currentUser && u._id === currentUser._id ? 'আপনি নিজেকে deactivate করতে পারবেন না' : (u.isActive ? 'Deactivate' : 'Activate')}
                        style={{ 
                          background: currentUser && u._id === currentUser._id ? 'var(--bg3)' : (u.isActive ? 'var(--danger-light)' : 'var(--primary-light)'), 
                          borderRadius: 8, 
                          padding: '6px 10px',
                          opacity: currentUser && u._id === currentUser._id ? 0.5 : 1,
                          cursor: currentUser && u._id === currentUser._id ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {u.isActive
                          ? <Icon name="x" size={14} style={{ color: 'var(--danger)' }} />
                          : <Icon name="check" size={14} style={{ color: 'var(--primary)' }} />}
                      </button>
                    </td>
                  </tr>
                        );
                      })}
                    </React.Fragment>
                  ));
                })()}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div id="mobile-cards">
            {groupedUsers.map(group => (
              <div key={group.label} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt2)', background: 'var(--bg3)', padding: '6px 12px', borderRadius: 8, marginBottom: 8 }}>
                  {group.label}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {group.items.map((u, i) => (
              <div key={u._id} style={{
                background: 'var(--bg)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                transition: 'box-shadow 0.2s, transform 0.2s',
                animation: `fadeIn 0.2s ease ${i * 0.03}s both`,
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {/* Avatar */}
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--primary-mid))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
                  {u.name?.slice(0, 2).toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</span>
                    <span className={`tag ${roleColor(u.role)}`} style={{ fontSize: 10 }}>{u.role}</span>
                    {u.shift && <span className="tag tag-purple" style={{ fontSize: 10 }}>{u.shift} Shift</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--txt2)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                  <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 3 }}>
                    {u.role === 'student'
                      ? `${u.departmentId?.code || '-'} • Sem ${u.semester} • Group ${u.section} • ID: ${u.studentId || '-'}`
                      : u.departmentId?.name || '-'}
                  </div>
                </div>

                {/* Right */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                  <span className={`tag ${u.isActive ? 'tag-green' : 'tag-red'}`} style={{ fontSize: 10 }}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => toggleActive(u)}
                    disabled={currentUser && u._id === currentUser._id} // Add this
                    title={currentUser && u._id === currentUser._id ? 'আপনি নিজেকে deactivate করতে পারবেন না' : (u.isActive ? 'Deactivate' : 'Activate')}
                    style={{
                      border: 'none', cursor: currentUser && u._id === currentUser._id ? 'not-allowed' : 'pointer', borderRadius: 8,
                      padding: '5px 10px', fontSize: 11, fontWeight: 600,
                      fontFamily: 'inherit', transition: 'all 0.15s',
                      background: currentUser && u._id === currentUser._id ? 'var(--bg3)' : (u.isActive ? 'var(--danger-light)' : 'var(--primary-light)'),
                      color: currentUser && u._id === currentUser._id ? 'var(--txt3)' : (u.isActive ? 'var(--danger)' : 'var(--primary)'),
                      opacity: currentUser && u._id === currentUser._id ? 0.5 : 1,
                    }}
                  >
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Responsive style */}
      <style>{`
        @media (min-width: 768px) {
          #desktop-table { display: block !important; }
          #mobile-cards { display: none !important; }
        }
      `}</style>
    </div>
  );
}