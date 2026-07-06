import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import QRCode from 'qrcode';
import sendEmail from '@/lib/sendEmail';
import { errorResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  await dbConnect();
  try {
    const { name, email, password, role, studentId, departmentId, semester, section, shift, secretKey } = await request.json();
    if (!['student', 'teacher'].includes(role)) {
      return NextResponse.json({ success: false, message: 'Only student or teacher can register.' }, { status: 400 });
    }
    if (!name || !email || !password || !role) {
      return NextResponse.json({ success: false, message: 'Name, Email, Password ও role দিন' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ success: false, message: 'Password কমপক্ষে ৬ অক্ষরের হতে হবে' }, { status: 400 });
    }

    const existing = await User.findOne({ email });
    if (existing) return NextResponse.json({ success: false, message: 'এই email দিয়ে আগেই account আছে' }, { status: 400 });

    if (role === 'teacher') {
      if (!secretKey) return NextResponse.json({ success: false, message: 'Teacher Secret Key দিন' }, { status: 403 });
      if (secretKey !== process.env.TEACHER_SECRET_KEY) return NextResponse.json({ success: false, message: 'Secret Key সঠিক নয়!' }, { status: 403 });
      if (!shift) return NextResponse.json({ success: false, message: 'Shift দিন' }, { status: 400 });
    }

    if (role === 'student') {
      if (!studentId || !departmentId || !semester || !section || !shift) {
        return NextResponse.json({ success: false, message: 'Student ID, Department, Semester, Section ও Shift দিন' }, { status: 400 });
      }
      const existingStudent = await User.findOne({ studentId });
      if (existingStudent) return NextResponse.json({ success: false, message: 'এই Student ID আগেই registered' }, { status: 400 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.create({
      name, email, password, role,
      studentId: role === 'student' ? studentId : undefined,
      departmentId: role === 'student' ? departmentId : undefined,
      semester: role === 'student' ? parseInt(semester) : undefined,
      section: role === 'student' ? section : undefined,
      shift,
      isVerified: false,
      verificationOTP: otp,
      verificationExpire: otpExpire,
    });

    if (role === 'student' && studentId) {
      const qrData = JSON.stringify({ studentId: user._id.toString(), sid: studentId });
      user.qrCode = await QRCode.toDataURL(qrData);
      await user.save();
    }

    const subject = 'PolyAttend Email Verification Code';
    const message = `Hello ${name},\n\nWelcome to PolyAttend. Please use the following One-Time Password (OTP) to verify your email address:\n\nVerification Code: ${otp}\n\nThis OTP is valid for 10 minutes. If you did not register for this account, please ignore this email.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #1a6b4a; text-align: center;">Welcome to PolyAttend</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Thank you for registering at PolyAttend. To complete your registration, please verify your email address using the following code:</p>
        <div style="background-color: #f0fdf4; border: 2px dashed #1a6b4a; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0;">
          <span style="font-size: 24px; font-weight: bold; color: #1a6b4a; letter-spacing: 5px;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 13px;">This code is valid for 10 minutes. If you did not create this account, please ignore this email.</p>
      </div>`;

    await sendEmail({ email: user.email, subject, message, html });

    return NextResponse.json({
      success: true,
      message: 'Registration successful! Please check your email for the verification code.',
      email: user.email,
      requiresVerification: true,
    }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}
