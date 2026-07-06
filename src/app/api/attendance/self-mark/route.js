import { NextResponse } from 'next/server';
import Attendance from '@/lib/models/Attendance';
import Session from '@/lib/models/Session';
import { requireAuth, errorResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function classNameFromSession(session) {
  if (!session || session.semester == null || session.section == null || session.section === '') {
    return 'Class unknown';
  }
  return `Class ${session.semester}-${session.section}`;
}

// POST /api/attendance/self-mark
// Student-only. Body: { sessionId }
// Student clicks "Mark My Attendance" on their dashboard while a session is
// active; this marks them present directly — no QR scan, no teacher action.
export async function POST(request) {
  const auth = await requireAuth(request, ['student']);
  if (auth.error) return auth.error;
  try {
    const student = auth.user;
    const { sessionId } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ success: false, message: 'sessionId প্রয়োজন' }, { status: 400 });
    }

    const session = await Session.findById(sessionId).populate('subjectId', 'shift');
    if (!session) return NextResponse.json({ success: false, message: 'Session পাওয়া যায়নি' }, { status: 404 });
    if (session.status !== 'active') {
      return NextResponse.json({ success: false, message: 'এই session আর active নেই' }, { status: 400 });
    }

    // Make sure this student actually belongs to this class/section/shift —
    // otherwise anyone could self-mark into any session by guessing an id.
    const sessionShift = session.shift || session.subjectId?.shift;
    const classMismatch =
      !student.departmentId ||
      student.semester !== session.semester ||
      student.section !== session.section ||
      student.departmentId.toString() !== session.departmentId.toString() ||
      (sessionShift && student.shift !== sessionShift);

    if (classMismatch) {
      return NextResponse.json({ success: false, message: 'এই session আপনার class-এর নয়' }, { status: 403 });
    }

    const existing = await Attendance.findOne({ sessionId, studentId: student._id });
    if (existing && existing.status === 'present') {
      return NextResponse.json({
        success: false,
        message: 'আপনার attendance ইতিমধ্যে marked হয়ে গেছে',
        attendance: existing,
      }, { status: 400 });
    }

    let attendance;
    if (existing) {
      existing.status = 'present';
      existing.scannedAt = new Date();
      existing.markedBy = 'self';
      attendance = await existing.save();
    } else {
      attendance = await Attendance.create({
        sessionId, studentId: student._id, subjectId: session.subjectId,
        departmentId: session.departmentId, semester: session.semester,
        section: session.section, className: classNameFromSession(session),
        date: new Date(), status: 'present', scannedAt: new Date(), markedBy: 'self',
      });
    }

    await Session.findByIdAndUpdate(sessionId, { $inc: { presentCount: 1 } });

    return NextResponse.json({
      success: true,
      message: '✅ আপনার attendance marked হয়েছে',
      attendance,
    });
  } catch (error) { return errorResponse(error); }
}
