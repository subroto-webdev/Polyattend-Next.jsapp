import sendEmail from './sendEmail';

// ── FEATURE: Email notifications ───────────────────────────────────────────
// Used for both:
//   1) "Class started" — sent to every student in a class the moment a
//      teacher starts an attendance session (POST /api/sessions).
//   2) "You missed a class" — sent to each student who ended up marked
//      absent when a session is closed (PUT /api/sessions/:id/end).
//
// Sends concurrently and never throws: a slow/broken mail provider, or one
// bad email address, must never fail the session start/end request itself
// (the attendance session is the important part; the email is a courtesy).
// Each recipient's send is isolated with Promise.allSettled.
export async function notifyBulk(students, buildMessage) {
  const recipients = (students || []).filter((s) => s?.email);
  if (recipients.length === 0) return { sent: 0, failed: 0 };

  const results = await Promise.allSettled(
    recipients.map((student) => {
      const { subject, message, html } = buildMessage(student);
      return sendEmail({ email: student.email, subject, message, html });
    })
  );

  const sent = results.filter((r) => r.status === 'fulfilled' && r.value?.success).length;
  return { sent, failed: recipients.length - sent };
}

export function classStartedEmail({ subjectName, subjectCode, teacherName }) {
  const subject = `${subjectName} ক্লাস শুরু হয়েছে — এখনই Attendance দিন`;
  const message = `${subjectName} (${subjectCode})-এর ক্লাস এইমাত্র শুরু হয়েছে${teacherName ? ` (${teacherName})` : ''}। এখনই আপনার Attendance দিন।`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #1a6b4a; text-align: center;">📚 ক্লাস শুরু হয়েছে!</h2>
      <p><strong>${subjectName} (${subjectCode})</strong>-এর ক্লাস এইমাত্র শুরু হয়েছে${teacherName ? `, শিক্ষক: <strong>${teacherName}</strong>` : ''}।</p>
      <div style="background-color: #f0fdf4; border: 2px solid #1a6b4a; border-radius: 8px; padding: 14px; text-align: center; margin: 20px 0;">
        <span style="font-size: 15px; font-weight: bold; color: #1a6b4a;">এখনই আপনার Attendance দিন</span>
      </div>
      <p style="color: #64748b; font-size: 13px;">যদি আপনি ইতিমধ্যে ক্লাসে উপস্থিত থাকেন, শিক্ষক QR scan বা manual attendance-এর মাধ্যমে আপনাকে present করবেন। App-এর মাধ্যমে self check-in-ও করতে পারেন।</p>
    </div>`;
  return { subject, message, html };
}

export function classMissedEmail({ subjectName, subjectCode, date }) {
  const dateStr = new Date(date).toLocaleDateString('en-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const subject = `আপনি ${subjectName}-এর একটি ক্লাস miss করেছেন`;
  const message = `${dateStr} তারিখে ${subjectName} (${subjectCode})-এর ক্লাসে আপনাকে Absent হিসেবে চিহ্নিত করা হয়েছে।`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #991b1b; text-align: center;">⚠️ Class Missed</h2>
      <p><strong>${dateStr}</strong> তারিখে <strong>${subjectName} (${subjectCode})</strong>-এর ক্লাসে আপনাকে <strong style="color:#991b1b;">Absent</strong> হিসেবে চিহ্নিত করা হয়েছে।</p>
      <p style="color: #64748b; font-size: 13px;">নিয়মিত attendance বজায় রাখা জরুরি — নির্দিষ্ট percentage-এর নিচে attendance থাকলে আপনি exam-এ বসতে পারবেন না। আপনার সামগ্রিক attendance অ্যাপে "Attendance" পেজে দেখতে পারবেন।</p>
    </div>`;
  return { subject, message, html };
}
