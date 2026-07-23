'use client';
import { useEffect } from 'react';
import { activateSessionGuard, deactivateSessionGuard, confirmLeaveActiveSession } from '@/utils/sessionGuard';

// Call with (isActive, label) from any page that runs a live attendance
// session (Manual Attendance, QR Scanner). While isActive is true:
//   - Refreshing / closing the tab / typing a new address shows the
//     browser's own "Leave site?" warning (beforeunload).
//   - Pressing the Back button shows our Bangla confirm() dialog instead of
//     silently leaving (via a well-known SPA trick: push one extra history
//     entry so the first Back press is ours to intercept).
//   - In-app navigation (sidebar/bottom-nav buttons) and Logout are guarded
//     separately, in AppShell, using the same shared confirm().
export default function useSessionExitGuard(isActive, label) {
  useEffect(() => {
    if (isActive) activateSessionGuard(label);
    else deactivateSessionGuard();
    return () => deactivateSessionGuard();
  }, [isActive, label]);

  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (!isActive) return;
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;

    // Extra history entry that only exists so the next Back press has
    // something harmless to consume first, giving us a chance to intercept.
    window.history.pushState({ __sessionGuard: true }, '');

    const onPopState = () => {
      if (confirmLeaveActiveSession()) {
        deactivateSessionGuard();
        window.history.back();
      } else {
        // Cancelled — restore the guard entry so the next Back press is
        // caught here again instead of actually leaving.
        window.history.pushState({ __sessionGuard: true }, '');
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [isActive]);
}
