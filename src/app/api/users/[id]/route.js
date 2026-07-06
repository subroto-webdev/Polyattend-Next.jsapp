import { NextResponse } from 'next/server';
import User from '@/lib/models/User';
import { requireAuth, errorResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/users/:id
export async function GET(request, { params }) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  try {
    const user = await User.findById(params.id).select('-password').populate('departmentId', 'name code');
    if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    return NextResponse.json({ success: true, user });
  } catch (error) { return errorResponse(error); }
}

// PUT /api/users/:id
export async function PUT(request, { params }) {
  const auth = await requireAuth(request, ['admin']);
  if (auth.error) return auth.error;
  try {
    const { name, email, phone, departmentId, semester, section, isActive } = await request.json();
    const user = await User.findByIdAndUpdate(
      params.id,
      { name, email, phone, departmentId, semester, section, isActive },
      { new: true, runValidators: true }
    ).select('-password').populate('departmentId', 'name code');
    if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    return NextResponse.json({ success: true, user });
  } catch (error) { return errorResponse(error); }
}

// DELETE /api/users/:id
export async function DELETE(request, { params }) {
  const auth = await requireAuth(request, ['admin']);
  if (auth.error) return auth.error;
  try {
    const user = await User.findByIdAndUpdate(params.id, { isActive: false }, { new: true });
    if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'User deactivated' });
  } catch (error) { return errorResponse(error); }
}
