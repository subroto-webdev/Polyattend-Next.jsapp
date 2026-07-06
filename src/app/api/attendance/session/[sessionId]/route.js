import { NextResponse } from 'next/server';
import Attendance from '@/lib/models/Attendance';
import { requireAuth, errorResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/attendance/session/:sessionId
export async function GET(request, { params }) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  try {
    const attendance = await Attendance.find({ sessionId: params.sessionId })
      .populate('studentId', 'name studentId section shift')
      .sort({ 'studentId.name': 1 });
    return NextResponse.json({ success: true, count: attendance.length, attendance });
  } catch (error) { return errorResponse(error); }
}
