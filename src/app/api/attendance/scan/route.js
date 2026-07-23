import { NextResponse } from 'next/server';
import Attendance from '@/lib/models/Attendance';
import Session from '@/lib/models/Session';
import User from '@/lib/models/User';
import { requireAuth, errorResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function classNameFromSession(session) {
  if (!session || session.semester == null || session.section == null || session.section === '') {
    return 'Class unknown';
  }
  return `Class ${session.semester}-${session.section}`;
}

// POST /api/attendance/scan - QR code scan
export async function POST(request) {
  const auth = await requireAuth(request, ['teacher', 'admin']);
  if (auth.error) return auth.error;
  try {
    const { sessionId, qrData } = await request.json();
    let parsed;
    try {
      parsed = typeof qrData === 'object' ? qrData : JSON.parse(qrData.trim());
    } catch (err) {
      return NextResponse.json({ success: false, message: 'Invalid QR format' }, { status: 400 });
    }

    const session = await Session.findById(sessionId).populate('subjectId', 'shift');
    if (!session) return NextResponse.json({ success: false, message: 'Session not found' }, { status: 404 });
    if (session.status !== 'active') return NextResponse.json({ success: false, message: 'Session is not active' }, { status: 400 });
    if (auth.user.role === 'teacher' && session.teacherId.toString() !== auth.user._id.toString()) {
      return NextResponse.json({ success: false, message: 'Not your session' }, { status: 403 });
    }

    const student = await User.findById(parsed.studentId);
    if (!student || student.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    const sessionShift = session.shift || session.subjectId?.shift;
    if (sessionShift && student.shift !== sessionShift) {
      return NextResponse.json({
        success: false,
        message: `${student.name} এই shift-এর student নয় (Student: ${student.shift} Shift, Class: ${sessionShift} Shift)`,
      }, { status: 400 });
    }

    const classMismatch =
      student.semester !== session.semester ||
      student.section !== session.section ||
      student.departmentId.toString() !== session.departmentId.toString();

    if (classMismatch) {
      return NextResponse.json({
        success: false,
        message: `${student.name} এই class-এর student নয় (${session.semester}-${session.section} section)`,
      }, { status: 400 });
    }

    const existing = await Attendance.findOne({ sessionId, studentId: student._id });
    if (existing) {
      return NextResponse.json({
        success: false,
        message: `${student.name} ইতিমধ্যে present marked`,
        student: { name: student.name, studentId: student.studentId },
      }, { status: 400 });
    }

    const attendance = await Attendance.create({
      sessionId, studentId: student._id, subjectId: session.subjectId,
      departmentId: session.departmentId, semester: session.semester,
      section: session.section, className: classNameFromSession(session),
      date: new Date(), status: 'present', scannedAt: new Date(), markedBy: 'qr',
    });

    await Session.findByIdAndUpdate(sessionId, { $inc: { presentCount: 1 } });

    return NextResponse.json({
      success: true,
      message: `✅ ${student.name} present marked`,
      student: { name: student.name, studentId: student.studentId, section: student.section, shift: student.shift },
      attendance,
    });
  } catch (error) { return errorResponse(error); }
}
