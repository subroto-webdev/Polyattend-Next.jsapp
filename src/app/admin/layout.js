'use client';
import RequireRole from '@/components/common/RequireRole';
import AppShell from '@/components/common/AppShell';

const navItems = [
  { label: 'Dashboard', icon: 'dashboard', path: '/admin' },
  { section: 'Management' },
  { label: 'Users', icon: 'users', path: '/admin/users' },
  { label: 'Departments', icon: 'department', path: '/admin/departments' },
  { label: 'Subjects', icon: 'book', path: '/admin/subjects' },
  { label: 'Holidays', icon: 'calendar', path: '/admin/holidays' },
  { section: 'Analytics' },
  { label: 'Reports', icon: 'chart', path: '/admin/reports' },
];

export default function AdminRootLayout({ children }) {
  return (
    <RequireRole roles={['admin']}>
      <AppShell navItems={navItems}>{children}</AppShell>
    </RequireRole>
  );
}
