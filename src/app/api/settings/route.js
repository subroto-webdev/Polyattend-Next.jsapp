import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Settings from '@/lib/models/Settings';
import { requireAuth, errorResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function getOrCreateSettings() {
  let settings = await Settings.findOne({ key: 'global' });
  if (!settings) settings = await Settings.create({ key: 'global' });
  return settings;
}

// GET /api/settings — any authenticated user can read (students need the
// threshold to render their exam-eligibility badge; teachers/admin too).
export async function GET(request) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;
  await dbConnect();
  try {
    const settings = await getOrCreateSettings();
    return NextResponse.json({ success: true, settings: { attendanceThreshold: settings.attendanceThreshold } });
  } catch (error) { return errorResponse(error); }
}

// PUT /api/settings — admin only.
export async function PUT(request) {
  const auth = await requireAuth(request, ['admin']);
  if (auth.error) return auth.error;
  await dbConnect();
  try {
    const body = await request.json();
    const { attendanceThreshold } = body;
    if (attendanceThreshold == null || isNaN(attendanceThreshold) || attendanceThreshold < 0 || attendanceThreshold > 100) {
      return NextResponse.json({ success: false, message: 'Attendance threshold অবশ্যই ০ থেকে ১০০-এর মধ্যে একটি সংখ্যা হতে হবে' }, { status: 400 });
    }
    const settings = await getOrCreateSettings();
    settings.attendanceThreshold = Math.round(attendanceThreshold);
    await settings.save();
    return NextResponse.json({ success: true, message: 'Settings সংরক্ষিত হয়েছে', settings: { attendanceThreshold: settings.attendanceThreshold } });
  } catch (error) { return errorResponse(error); }
}
