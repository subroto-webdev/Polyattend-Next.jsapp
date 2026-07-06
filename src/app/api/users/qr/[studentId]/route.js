import { NextResponse } from 'next/server';
import User from '@/lib/models/User';
import QRCode from 'qrcode';
import { requireAuth, errorResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/users/qr/:studentId - Get student QR code
export async function GET(request, { params }) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  try {
    const user = await User.findOne({ studentId: params.studentId, role: 'student' });
    if (!user) return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });

    if (!user.qrCode) {
      const qrData = JSON.stringify({ studentId: user._id.toString(), sid: user.studentId });
      user.qrCode = await QRCode.toDataURL(qrData);
      await user.save();
    }
    return NextResponse.json({ success: true, qrCode: user.qrCode, studentId: user.studentId, name: user.name });
  } catch (error) { return errorResponse(error); }
}
