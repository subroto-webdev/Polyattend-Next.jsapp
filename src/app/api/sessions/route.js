import { NextResponse } from 'next/server';
import Session from '@/lib/models/Session';
import User from '@/lib/models/User';
import Subject from '@/lib/models/Subject';
import { requireAuth, errorResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/sessions - Teacher starts a session
export async function POST(request) {
  const auth = await requireAuth(request, ['teacher', 'admin']);
  if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const subjectId = body?.subjectId;
    const semester = body?.semester;
    const section = body?.section;

    if (!subjectId || semester == null || !section) {
      return NextResponse.json({ success: false, message: 'Subject, semester ও section প্রয়োজন' }, { status: 400 });
    }

    // Resolve department/shift from the Subject document itself (source of truth),
    // instead of the departmentId the client sent — that value could be null
    // whenever the subject's populated departmentId was unavailable on the
    // frontend, which used to crash later reads of the resulting session.
    let subject;
    if (auth.user.role === 'teacher') {
      subject = await Subject.findOne({ _id: subjectId, teacherId: auth.user._id, isActive: true });
      if (!subject) return NextResponse.json({ success: false, message: 'You are not assigned to this subject' }, { status: 403 });
    } else {
      subject = await Subject.findById(subjectId);
      if (!subject) return NextResponse.json({ success: false, message: 'Subject খুঁজে পাওয়া যায়নি' }, { status: 404 });
    }

    const departmentId = subject.departmentId;
    if (!departmentId) {
      return NextResponse.json({ success: false, message: 'এই subject-এর কোনো valid Department নেই। Subject-টি Edit করে Department আবার সেট করুন।' }, { status: 400 });
    }
    const subjectShift = subject.shift;

    const existing = await Session.findOne({ subjectId, semester, section, status: 'active' });
    if (existing) {
      return NextResponse.json({ success: false, message: 'An active session already exists for this class', session: existing }, { status: 400 });
    }

    const shiftFilter = { role: 'student', departmentId, semester: parseInt(semester), section, isActive: true };
    if (subjectShift) shiftFilter.shift = subjectShift;

    const totalStudents = await User.countDocuments(shiftFilter);

    const session = await Session.create({
      teacherId: auth.user._id, departmentId, subjectId,
      semester: parseInt(semester), section, shift: subjectShift, totalStudents,
    });

    const populated = await Session.findById(session._id)
      .populate('teacherId', 'name').populate('departmentId', 'name code').populate('subjectId', 'name code');

    return NextResponse.json({ success: true, session: populated }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}

// GET /api/sessions - Get sessions (role-based)
export async function GET(request) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');
    const subjectId = searchParams.get('subjectId');
    const semester = searchParams.get('semester');
    const section = searchParams.get('section');
    const status = searchParams.get('status');

    const filter = {};
    if (auth.user.role === 'teacher') filter.teacherId = auth.user._id;
    if (departmentId) filter.departmentId = departmentId;
    if (subjectId) filter.subjectId = subjectId;
    if (semester) filter.semester = parseInt(semester);
    if (section) filter.section = section;
    if (status) filter.status = status;

    const sessions = await Session.find(filter)
      .populate('teacherId', 'name').populate('departmentId', 'name code').populate('subjectId', 'name code')
      .sort({ createdAt: -1 }).limit(100);

    return NextResponse.json({ success: true, count: sessions.length, sessions });
  } catch (error) { return errorResponse(error); }
}
