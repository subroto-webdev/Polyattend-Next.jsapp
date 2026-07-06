import { NextResponse } from 'next/server';
import Holiday from '@/lib/models/Holiday';
import { requireAuth, errorResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const checkDate = new Date(date);
    if (checkDate.getDay() === 5) return NextResponse.json({ success: true, isHoliday: true, reason: 'Friday' });
    const holiday = await Holiday.findOne({ startDate: { $lte: checkDate }, endDate: { $gte: checkDate } });
    return NextResponse.json({ success: true, isHoliday: !!holiday, holiday: holiday || null });
  } catch (error) { return errorResponse(error); }
}
