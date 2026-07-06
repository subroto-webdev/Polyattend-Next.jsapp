import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import { errorResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  await dbConnect();
  try {
    const { email, otp } = await request.json();
    if (!email || !otp) return NextResponse.json({ success: false, message: 'ইমেইল ও OTP দিন' }, { status: 400 });

    const user = await User.findOne({ email, verificationOTP: otp, verificationExpire: { $gt: Date.now() } });
    if (!user) return NextResponse.json({ success: false, message: 'ভুল OTP অথবা ওটিপির মেয়াদ শেষ হয়ে গেছে' }, { status: 400 });

    user.isVerified = true;
    user.verificationOTP = null;
    user.verificationExpire = null;
    await user.save();

    return NextResponse.json({ success: true, message: 'ইমেইল ভেরিফিকেশন সফল হয়েছে! আপনি এখন লগইন করতে পারবেন।' });
  } catch (error) { return errorResponse(error); }
}
