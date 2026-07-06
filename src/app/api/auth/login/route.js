import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import { generateToken, errorResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  await dbConnect();
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Please provide email and password' }, { status: 400 });
    }
    const user = await User.findOne({ email }).populate('departmentId', 'name code');
    if (!user) return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
    if (!user.isActive) return NextResponse.json({ success: false, message: 'Account is deactivated' }, { status: 403 });
    if (!(await user.matchPassword(password))) {
      return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
    }

    const token = generateToken(user._id);
    return NextResponse.json({
      success: true,
      token,
      user: {
        _id: user._id, name: user.name, email: user.email, role: user.role, shift: user.shift,
        studentId: user.studentId, departmentId: user.departmentId, semester: user.semester,
        section: user.section, qrCode: user.qrCode,
      },
    });
  } catch (error) { return errorResponse(error); }
}
