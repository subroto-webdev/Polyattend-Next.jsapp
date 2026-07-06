import { NextResponse } from 'next/server';
import User from '@/lib/models/User';
import { requireAuth, errorResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/users - Admin/Teacher: get all users (list + search)
export async function GET(request) {
  const auth = await requireAuth(request, ['admin', 'teacher']);
  if (auth.error) return auth.error;
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const departmentId = searchParams.get('departmentId');
    const semester = searchParams.get('semester');
    const section = searchParams.get('section');
    const shift = searchParams.get('shift');
    const search = searchParams.get('search');

    const filter = {};
    if (role) filter.role = role;
    if (departmentId) filter.departmentId = departmentId;
    if (semester) filter.semester = parseInt(semester);
    if (section) filter.section = section;
    if (shift) filter.shift = shift;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
      ];
    }

    if (auth.user.role === 'teacher' && role === 'student') {
      filter.shift = auth.user.shift;
    }

    const users = await User.find(filter).select('-password').populate('departmentId', 'name code').sort({ createdAt: -1 });
    return NextResponse.json({ success: true, count: users.length, users });
  } catch (error) { return errorResponse(error); }
}
