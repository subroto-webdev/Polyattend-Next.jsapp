import { NextResponse } from 'next/server';
import Attendance from '@/lib/models/Attendance';
import Session from '@/lib/models/Session';
import { requireAuth, errorResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/attendance/session/:sessionId
export async function GET(request, { params }) {
  // SECURITY FIX: previously any authenticated user (including a student)
  // could pull the full attendance list — every student's name/ID/status —
  // for any session just by knowing its ID. Restrict to teacher/admin, and
  // to the owning teacher specifically.
  const auth = await requireAuth(request, ['teacher', 'admin']);
  if (auth.error) return auth.error;
  try {
    const session = await Session.findById(params.sessionId);
    if (!session) return NextResponse.json({ success: false, message: 'Session not found' }, { status: 404 });
    if (auth.user.role === 'teacher' && session.teacherId.toString() !== auth.user._id.toString()) {
      return NextResponse.json({ success: false, message: 'এটা আপনার session নয়' }, { status: 403 });
    }

    const attendance = await Attendance.find({ sessionId: params.sessionId })
      .populate('studentId', 'name studentId section shift')
      .sort({ 'studentId.name': 1 });
    return NextResponse.json({ success: true, count: attendance.length, attendance });
  } catch (error) { return errorResponse(error); }
}
