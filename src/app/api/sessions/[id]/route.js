import { NextResponse } from 'next/server';
import Session from '@/lib/models/Session';
import Attendance from '@/lib/models/Attendance';
import { requireAuth, errorResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/sessions/:id
export async function GET(request, { params }) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  try {
    const session = await Session.findById(params.id)
      .populate('teacherId', 'name').populate('departmentId', 'name code').populate('subjectId', 'name code');
    if (!session) return NextResponse.json({ success: false, message: 'Session not found' }, { status: 404 });

    const attendance = await Attendance.find({ sessionId: session._id }).populate('studentId', 'name studentId section');
    return NextResponse.json({ success: true, session, attendance });
  } catch (error) { return errorResponse(error); }
}
