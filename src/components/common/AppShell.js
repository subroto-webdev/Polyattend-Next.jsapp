'use client';
import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { blockIfSessionActive } from '@/utils/sessionGuard';
import Icon from './Icon';

export default function AppShell({ navItems, children }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path) => pathname === path || (path !== `/${user?.role}` && pathname.startsWith(path + '/'));

  const handleNav = (path) => {
    // FIX: this used to be a skippable confirm() ("leave anyway?"). A
    // teacher could just click through it, which defeats the point. Now
    // it's a true hard block — while a session is active, navigation is
    // simply cancelled with no bypass; ending the session is the only way
    // through.
    if (blockIfSessionActive()) return;
    router.push(path);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    if (blockIfSessionActive()) return;
    logout();
    router.push('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';

  return (
    <div className="shell-root">
      {/* SIDEBAR */}
      <nav className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Icon name="school" size={18} />
          </div>
          <div>
            <div className="sidebar-logo-text">PolyAttend</div>
            <div className="sidebar-logo-sub">Attendance System</div>
          </div>
        </div>

        <div className="sidebar-nav">
          {navItems.map((item, idx) => (
            item.section ? (
              <div key={idx} className="sidebar-section">{item.section}</div>
            ) : (
              <button key={idx} className={`sidebar-item${isActive(item.path) ? ' active' : ''}`} onClick={() => handleNav(item.path)}>
                <Icon name={item.icon} size={18} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && <span className="sidebar-badge">{item.badge}</span>}
              </button>
            )
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-username">{user?.name}</div>
            <div className="sidebar-role" style={{ textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout} title="Logout">
            <Icon name="logout" size={16} />
          </button>
        </div>
      </nav>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* MAIN */}
      <div className="shell-main">
        {/* MOBILE TOP NAV */}
        <header className="top-nav">
          <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
            <Icon name="menu" size={22} />
          </button>
          <div className="top-nav-logo">
            <div className="top-nav-logo-icon"><Icon name="school" size={14} /></div>
            PolyAttend
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className={`tag ${user?.role === 'teacher' ? 'tag-green' : user?.role === 'admin' ? 'tag-blue' : 'tag-amber'}`} style={{ fontSize: 10, textTransform: 'capitalize' }}>
              {user?.role}
            </span>
          </div>
        </header>

        {/* CONTENT */}
        <main className="shell-content">
          {children}
        </main>

        {/* MOBILE BOTTOM NAV */}
        <nav className="bottom-nav">
          {navItems.filter(n => !n.section && n.icon).slice(0, 5).map((item, idx) => (
            <button key={idx} className={`bnav-btn${isActive(item.path) ? ' active' : ''}`} onClick={() => handleNav(item.path)}>
              <Icon name={item.icon} size={22} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
