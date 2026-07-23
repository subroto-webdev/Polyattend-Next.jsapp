'use client';

// ── FEATURE: Active-session exit guard ─────────────────────────────────────
// While a teacher has a live Attendance Session running (Manual Attendance
// OR QR Scanner), they must be warned before leaving the page without
// properly ending it — whether via the Back button, a page refresh, clicking
// to another page in the app, or Logout. Losing track of an open session
// means students could keep self-checking-in into a class the teacher has
// stopped watching, or attendance simply never gets saved/closed.
//
// This is a plain module-level variable (not React state) on purpose: it
// needs to be readable from places with no natural access to the session
// page's component state — AppShell's nav/logout buttons, a `popstate`
// listener, a `beforeunload` listener — without threading props through the
// whole tree.
let activeGuard = null; // { label: string } | null

export function activateSessionGuard(label) {
  activeGuard = { label: label || 'Attendance' };
}

export function deactivateSessionGuard() {
  activeGuard = null;
}

export function isSessionGuardActive() {
  return !!activeGuard;
}

// Returns true if it's OK to leave (no active session, or the teacher
// explicitly confirmed they want to leave without ending it).
export function confirmLeaveActiveSession() {
  if (!activeGuard) return true;
  return window.confirm(
    `⚠️ "${activeGuard.label}" Session এখনও চলছে!\n\n` +
    `Session শেষ (End) না করে পেজ থেকে বের হলে attendance ঠিকমতো সংরক্ষণ নাও হতে পারে এবং students self attendance দিতেই থাকবে।\n\n` +
    `আপনি কি তবুও Session শেষ না করেই বের হতে চান?`
  );
}
