import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import PendingRegistration from '@/lib/models/PendingRegistration';
import QRCode from 'qrcode';
import { errorResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/auth/verify-email
// ── FIX (Requirement #5) ────────────────────────────────────────────────
// The real User account is created here, and only here — after the OTP the
// person submits matches a still-valid PendingRegistration. Nothing is
// written to the User collection before this point, so an abandoned or
// failed verification leaves no account behind.
//
// This same endpoint also still supports the older "already-created but
// unverified" User flow (for any account that existed before this fix, or
// was created by an admin) so existing OTP emails already sent don't break.
export async function POST(request) {
  await dbConnect();
  try {
    const { email, otp } = await request.json();
    if (!email || !otp) return NextResponse.json({ success: false, message: 'ইমেইল ও OTP দিন' }, { status: 400 });

    const normalizedEmail = email.toLowerCase().trim();

    const pending = await PendingRegistration.findOne({
      email: normalizedEmail, otp, otpExpire: { $gt: Date.now() },
    });

    if (pending) {
      // Re-check for race conditions: someone else may have grabbed this
      // email or studentId while this OTP was outstanding.
      const emailTaken = await User.findOne({ email: pending.email });
      if (emailTaken) {
        await PendingRegistration.findByIdAndDelete(pending._id);
        return NextResponse.json({ success: false, message: 'এই email দিয়ে আগেই account তৈরি হয়ে গেছে' }, { status: 400 });
      }
      if (pending.role === 'student' && pending.studentId) {
        const studentIdTaken = await User.findOne({ studentId: pending.studentId });
        if (studentIdTaken) {
          await PendingRegistration.findByIdAndDelete(pending._id);
          return NextResponse.json({ success: false, message: 'এই Student ID আগেই registered হয়ে গেছে' }, { status: 400 });
        }
      }

      // IMPORTANT: pending.password is already bcrypt-hashed (PendingRegistration
      // has its own pre-save hash hook). If we went through `new User(...).save()`,
      // User's own pre-save hook would see password as "modified" on this brand-new
      // document and hash it a SECOND time — locking the person out of the account
      // they just verified. To avoid that, insert the already-hashed password
      // directly via the native collection, bypassing Mongoose's pre-save hook.
      const now = new Date();
      const insertResult = await User.collection.insertOne({
        name: pending.name,
        email: pending.email,
        password: pending.password,
        role: pending.role,
        studentId: pending.studentId,
        departmentId: pending.departmentId,
        semester: pending.semester,
        section: pending.section,
        shift: pending.shift,
        isActive: true,
        isVerified: true,
        verificationOTP: null,
        verificationExpire: null,
        resetPasswordOTP: null,
        resetPasswordExpire: null,
        createdAt: now,
        updatedAt: now,
      });

      let user = await User.findById(insertResult.insertedId);

      if (pending.role === 'student' && pending.studentId) {
        const qrData = JSON.stringify({ studentId: user._id.toString(), sid: pending.studentId });
        user.qrCode = await QRCode.toDataURL(qrData);
        await user.save();
      }

      await PendingRegistration.findByIdAndDelete(pending._id);

      return NextResponse.json({ success: true, message: 'ইমেইল ভেরিফিকেশন সফল হয়েছে! আপনি এখন লগইন করতে পারবেন।' });
    }

    // Fallback: legacy path for a User document that was already created
    // (e.g. by an admin, or from before this fix) and just needs the flag flipped.
    const user = await User.findOne({ email: normalizedEmail, verificationOTP: otp, verificationExpire: { $gt: Date.now() } });
    if (!user) return NextResponse.json({ success: false, message: 'ভুল OTP অথবা ওটিপির মেয়াদ শেষ হয়ে গেছে' }, { status: 400 });

    user.isVerified = true;
    user.verificationOTP = null;
    user.verificationExpire = null;
    await user.save();

    return NextResponse.json({ success: true, message: 'ইমেইল ভেরিফিকেশন সফল হয়েছে! আপনি এখন লগইন করতে পারবেন।' });
  } catch (error) { return errorResponse(error); }
}
