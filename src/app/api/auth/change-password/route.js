import { NextResponse } from 'next/server';
import User from '@/lib/models/User';
import { requireAuth, errorResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PUT(request) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  try {
    const { currentPassword, newPassword } = await request.json();
    const user = await User.findById(auth.user._id);
    if (!(await user.matchPassword(currentPassword))) {
      return NextResponse.json({ success: false, message: 'Current password is incorrect' }, { status: 400 });
    }
    user.password = newPassword;
    await user.save();
    return NextResponse.json({ success: true, message: 'Password changed successfully' });
  } catch (error) { return errorResponse(error); }
}
