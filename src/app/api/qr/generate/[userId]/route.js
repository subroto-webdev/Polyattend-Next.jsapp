import { NextResponse } from 'next/server';
import User from '@/lib/models/User';
import QRCode from 'qrcode';
import { requireAuth, errorResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  try {
    const user = await User.findById(params.userId);
    if (!user || user.role !== 'student') return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    const qrData = JSON.stringify({ studentId: user._id.toString(), sid: user.studentId });
    const qrCode = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });
    if (!user.qrCode) { user.qrCode = qrCode; await user.save(); }
    return NextResponse.json({ success: true, qrCode, studentId: user.studentId, name: user.name });
  } catch (error) { return errorResponse(error); }
}
