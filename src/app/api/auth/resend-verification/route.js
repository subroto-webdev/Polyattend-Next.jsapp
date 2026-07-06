import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import sendEmail from '@/lib/sendEmail';
import { errorResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  await dbConnect();
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ success: false, message: 'ইমেইল দিন' }, { status: 400 });

    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ success: false, message: 'এই ইমেইলে কোনো account নেই' }, { status: 404 });
    if (user.isVerified) return NextResponse.json({ success: false, message: 'এই account ইতিমধ্যে verified' }, { status: 400 });

    const remaining = user.verificationExpire ? user.verificationExpire.getTime() - Date.now() : 0;
    if (remaining > 2 * 60 * 1000) {
      const mins = Math.ceil(remaining / 60000);
      return NextResponse.json({ success: false, message: `অনুগ্রহ করে ${mins} মিনিট অপেক্ষা করুন` }, { status: 429 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationOTP = otp;
    user.verificationExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const subject = 'PolyAttend — নতুন Verification Code';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #1a6b4a; text-align: center;">Email Verification</h2>
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>আপনার নতুন verification code:</p>
        <div style="background-color: #f0fdf4; border: 2px dashed #1a6b4a; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0;">
          <span style="font-size: 28px; font-weight: bold; color: #1a6b4a; letter-spacing: 8px;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 13px;">এই code ১০ মিনিট valid।</p>
      </div>`;

    await sendEmail({ email: user.email, subject, message: `Your new OTP: ${otp}`, html });
    return NextResponse.json({ success: true, message: 'নতুন OTP পাঠানো হয়েছে' });
  } catch (error) { return errorResponse(error); }
}
