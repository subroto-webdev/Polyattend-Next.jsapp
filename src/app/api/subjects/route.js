import { NextResponse } from 'next/server';
import Subject from '@/lib/models/Subject';
import { requireAuth, errorResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');
    const semester = searchParams.get('semester');
    const section = searchParams.get('section');
    const teacherId = searchParams.get('teacherId');

    const filter = { isActive: true };
    if (departmentId) filter.departmentId = departmentId;
    if (semester) filter.semester = parseInt(semester);
    if (section) filter.section = section;
    if (teacherId) filter.teacherId = teacherId;

    if (auth.user.role === 'student') {
      filter.departmentId = auth.user.departmentId;
      filter.semester = auth.user.semester;
      filter.section = auth.user.section;
      filter.shift = auth.user.shift;
    }
    if (auth.user.role === 'teacher') {
      filter.teacherId = auth.user._id;
      filter.shift = auth.user.shift;
    }

    const subjects = await Subject.find(filter)
      .populate('departmentId', 'name code')
      .populate('teacherId', 'name email')
      .sort({ semester: 1, name: 1 });
    return NextResponse.json({ success: true, subjects });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request) {
  const auth = await requireAuth(request, ['teacher', 'admin']);
  if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const { name, code, departmentId, semester, section } = body;
    if (!name || !code || !departmentId || !semester || !section) {
      return NextResponse.json({ success: false, message: 'All fields required' }, { status: 400 });
    }

    const teacherId = auth.user.role === 'teacher' ? auth.user._id : body.teacherId;
    const shift = auth.user.role === 'teacher' ? auth.user.shift : body.shift;

    if (!shift) return NextResponse.json({ success: false, message: 'Shift required' }, { status: 400 });

    const existing = await Subject.findOne({ code, departmentId, semester: parseInt(semester), section, shift });
    if (existing) return NextResponse.json({ success: false, message: 'Subject code already exists for this class' }, { status: 400 });

    const subject = await Subject.create({ name, code, departmentId, semester: parseInt(semester), section, shift, teacherId });
    const populated = await Subject.findById(subject._id).populate('departmentId', 'name code').populate('teacherId', 'name email');
    return NextResponse.json({ success: true, subject: populated }, { status: 201 });
  } catch (error) { return errorResponse(error, 400); }
}
