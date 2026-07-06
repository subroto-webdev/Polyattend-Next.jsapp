import { NextResponse } from 'next/server';
import TeacherAssignment from '@/lib/models/TeacherAssignment';
import { requireAuth, errorResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  try {
    const filter = { isActive: true };
    if (auth.user.role === 'teacher') filter.teacherId = auth.user._id;
    const assignments = await TeacherAssignment.find(filter)
      .populate('teacherId', 'name email')
      .populate('departmentId', 'name code')
      .populate('subjectId', 'name code');
    return NextResponse.json({ success: true, assignments });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request) {
  const auth = await requireAuth(request, ['admin']);
  if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const a = await TeacherAssignment.create(body);
    const populated = await TeacherAssignment.findById(a._id)
      .populate('teacherId', 'name').populate('departmentId', 'name code').populate('subjectId', 'name code');
    return NextResponse.json({ success: true, assignment: populated }, { status: 201 });
  } catch (error) { return errorResponse(error, 400); }
}
