import { NextResponse } from 'next/server';
import Department from '@/lib/models/Department';
import { requireAuth, errorResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  const auth = await requireAuth(request, ['admin']);
  if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const dept = await Department.findByIdAndUpdate(params.id, body, { new: true });
    return NextResponse.json({ success: true, department: dept });
  } catch (error) { return errorResponse(error, 400); }
}

export async function DELETE(request, { params }) {
  const auth = await requireAuth(request, ['admin']);
  if (auth.error) return auth.error;
  try {
    await Department.findByIdAndUpdate(params.id, { isActive: false });
    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch (error) { return errorResponse(error); }
}
