import { NextResponse } from 'next/server';
import User from '@/lib/models/User';
import QRCode from 'qrcode';
import { requireAuth, errorResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/users/qr/:studentId - Get student QR code
export async function GET(request, { params }) {
  // SECURITY FIX (important): this had no restriction at all — any
  // authenticated user, including another student, could fetch ANY
  // student's QR code image just by knowing their Student ID. Since that
  // QR encodes exactly the data used to self-mark/scan attendance, this
  // effectively let anyone impersonate another student for attendance
  // purposes. Only the student themselves, or a teacher/admin, may fetch it.
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  try {
    const user = await User.findOne({ studentId: params.studentId, role: 'student' });
    if (!user) return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });

    if (auth.user.role === 'student' && auth.user._id.toString() !== user._id.toString()) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
    }

    if (!user.qrCode) {
      const qrData = JSON.stringify({ studentId: user._id.toString(), sid: user.studentId });
      user.qrCode = await QRCode.toDataURL(qrData);
      await user.save();
    }
    return NextResponse.json({ success: true, qrCode: user.qrCode, studentId: user.studentId, name: user.name });
  } catch (error) { return errorResponse(error); }
}
