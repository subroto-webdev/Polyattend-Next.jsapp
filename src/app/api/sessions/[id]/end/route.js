import { NextResponse } from 'next/server';
import Session from '@/lib/models/Session';
import Attendance from '@/lib/models/Attendance';
import User from '@/lib/models/User';
import { requireAuth, errorResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function classNameFromSession(session) {
  if (!session || session.semester == null || session.section == null || session.section === '') {
    return 'Class unknown';
  }
  return `Class ${session.semester}-${session.section}`;
}

// PUT /api/sessions/:id/end - Teacher ends a session
export async function PUT(request, { params }) {
  const auth = await requireAuth(request, ['teacher', 'admin']);
  if (auth.error) return auth.error;
  try {
    const session = await Session.findById(params.id);
    if (!session) return NextResponse.json({ success: false, message: 'Session not found' }, { status: 404 });
    if (session.teacherId.toString() !== auth.user._id.toString() && auth.user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
    }
    if (session.status === 'ended') {
      return NextResponse.json({ success: false, message: 'Session already ended' }, { status: 400 });
    }

    const studentFilter = {
      role: 'student', departmentId: session.departmentId, semester: session.semester,
      section: session.section, isActive: true,
    };
    if (session.shift) studentFilter.shift = session.shift;

    const students = await User.find(studentFilter);
    const scanned = await Attendance.find({ sessionId: session._id }).select('studentId');
    const scannedIds = scanned.map(a => a.studentId.toString());

    const className = classNameFromSession(session);
    const absentOps = students
      .filter(s => !scannedIds.includes(s._id.toString()))
      .map(s => ({
        insertOne: {
          document: {
            sessionId: session._id, studentId: s._id, subjectId: session.subjectId,
            departmentId: session.departmentId, semester: session.semester,
            section: session.section, className, date: session.date, status: 'absent',
          },
        },
      }));

    if (absentOps.length > 0) await Attendance.bulkWrite(absentOps, { ordered: false });

    session.status = 'ended';
    session.endTime = new Date();
    session.presentCount = scannedIds.length;
    await session.save();

    return NextResponse.json({ success: true, message: 'Session ended', session });
  } catch (error) { return errorResponse(error); }
}
