'use client';
import RequireRole from '@/components/common/RequireRole';
import AppShell from '@/components/common/AppShell';

const navItems = [
  { label: 'Dashboard', icon: 'dashboard', path: '/teacher' },
  { label: 'My Subjects', icon: 'book', path: '/teacher/subjects' },
  { label: 'Take Attendance', icon: 'clipboard', path: '/teacher/attendance' },
  { label: 'QR Scanner', icon: 'qr', path: '/teacher/scanner' },
  { label: 'Session History', icon: 'history', path: '/teacher/sessions' },
  { label: 'Reports', icon: 'chart', path: '/teacher/reports' },
  { label: 'Excel Export', icon: 'excel', path: '/teacher/export' },
];

export default function TeacherRootLayout({ children }) {
  return (
    <RequireRole roles={['teacher']}>
      <AppShell navItems={navItems}>{children}</AppShell>
    </RequireRole>
  );
}
