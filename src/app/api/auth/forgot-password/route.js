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
    if (!email) return NextResponse.json({ success: false, message: 'ইমেইল এড্রেস দিন' }, { status: 400 });

    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ success: false, message: 'এই ইমেইল দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি' }, { status: 404 });
    if (!user.isActive) return NextResponse.json({ success: false, message: 'অ্যাকাউন্টটি ডিঅ্যাক্টিভেটেড আছে' }, { status: 403 });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOTP = otp;
    user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const subject = 'PolyAttend Password Reset OTP';
    const message = `Hello ${user.name},\n\nYou requested to reset your password. Please use the following 6-digit OTP to proceed:\n\nOTP Code: ${otp}\n\nThis OTP is valid for 10 minutes. If you did not request this, please ignore this email.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #1a6b4a; text-align: center;">Reset Your Password</h2>
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>We received a request to reset your password. Use the following 6-digit OTP code to complete the process:</p>
        <div style="background-color: #fffbeb; border: 2px dashed #f59e0b; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0;">
          <span style="font-size: 24px; font-weight: bold; color: #b45309; letter-spacing: 5px;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 13px;">This code is valid for 10 minutes. If you did not request this reset, please ignore this email.</p>
      </div>`;

    await sendEmail({ email: user.email, subject, message, html });
    return NextResponse.json({ success: true, message: 'পাসওয়ার্ড রিসেট OTP ইমেইলে পাঠানো হয়েছে' });
  } catch (error) { return errorResponse(error); }
}
