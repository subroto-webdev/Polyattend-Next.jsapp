import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import { errorResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  await dbConnect();
  try {
    const { email, otp, newPassword } = await request.json();
    if (!email || !otp || !newPassword) return NextResponse.json({ success: false, message: 'সবগুলো তথ্য দিন' }, { status: 400 });
    if (newPassword.length < 6) return NextResponse.json({ success: false, message: 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' }, { status: 400 });

    const user = await User.findOne({ email, resetPasswordOTP: otp, resetPasswordExpire: { $gt: Date.now() } });
    if (!user) return NextResponse.json({ success: false, message: 'ভুল OTP অথবা ওটিপির মেয়াদ শেষ হয়ে গেছে' }, { status: 400 });

    user.password = newPassword;
    user.isVerified = true;
    user.resetPasswordOTP = null;
    user.resetPasswordExpire = null;
    await user.save();

    return NextResponse.json({ success: true, message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে। নতুন পাসওয়ার্ড দিয়ে লগইন করুন।' });
  } catch (error) { return errorResponse(error); }
}
