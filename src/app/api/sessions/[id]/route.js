import { NextResponse } from 'next/server';
import Session from '@/lib/models/Session';
import Attendance from '@/lib/models/Attendance';
import { requireAuth, errorResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/sessions/:id
export async function GET(request, { params }) {
  // SECURITY FIX: exposed a session's full attendance list (every student's
  // name/ID/status) to any authenticated user, including students outside
  // that class. Restrict to teacher/admin, and to the owning teacher.
  const auth = await requireAuth(request, ['teacher', 'admin']);
  if (auth.error) return auth.error;
  try {
    const session = await Session.findById(params.id)
      .populate('teacherId', 'name').populate('departmentId', 'name code').populate('subjectId', 'name code');
    if (!session) return NextResponse.json({ success: false, message: 'Session not found' }, { status: 404 });
    if (auth.user.role === 'teacher' && session.teacherId?._id?.toString() !== auth.user._id.toString()) {
      return NextResponse.json({ success: false, message: 'এটা আপনার session নয়' }, { status: 403 });
    }

    const attendance = await Attendance.find({ sessionId: session._id }).populate('studentId', 'name studentId section');
    return NextResponse.json({ success: true, session, attendance });
  } catch (error) { return errorResponse(error); }
}
