# PolyAttend — Next.js 14 (Full‑Stack)

পুরনো architecture ছিল: **React (CRA) frontend + separate Express/Node backend**।
এখন পুরো project **একটাই Next.js 14 App Router app**-এ convert করা হয়েছে — frontend ও backend (API Routes) একসাথে, একই origin-এ। আলাদা Express server আর দরকার নেই।

## 🆕 নতুন ফিচার (নতুন কিছু বাদ যায়নি, শুধু এটা যোগ হয়েছে)
**Teacher session চলাকালীন Student Search করে Present করা যায়।**
`Teacher → QR Scanner` পেজে session active থাকলে "Student Search করে Present করুন" প্যানেল খুলে নাম/ID লিখে সার্চ করলে সেই class-এর student পাওয়া যাবে এবং সরাসরি *Present* মার্ক করা যাবে — QR স্ক্যান ছাড়াই। এটা backend-এ নতুন endpoint `POST /api/attendance/mark-present` দিয়ে কাজ করে (একই validation যা QR scan-এ হয়: session active কিনা, সঠিক class/section/shift কিনা, আগে থেকে present কিনা)।

## প্রজেক্ট স্ট্রাকচার
```
src/
  app/
    api/            ← সব backend route (Express controllers থেকে convert করা)
    login/ register/ forgot-password/ reset-password/ verify-email/
    admin/  teacher/  student/     ← role-based dashboards (layout.js + page.js)
  components/       ← common/admin/teacher/student React components (আগের মতোই, শুধু react-router বদলে next/navigation)
  context/AuthContext.js
  lib/
    dbConnect.js    ← Mongoose connection (cached) + auto department seeding
    auth.js         ← JWT verify + role-guard helper (Express middleware-এর বদলি)
    sendEmail.js
    models/         ← সব Mongoose models অপরিবর্তিত (User, Department, Subject, Session, Attendance, TeacherAssignment, Holiday, Feedback)
  utils/api.js      ← axios instance, baseURL এখন relative '/api' (same-origin)
```

## Setup

1. `.env.example` কপি করে `.env.local` বানান এবং mongo URI, JWT secret, SMTP (optional), TEACHER_SECRET_KEY দিন:
   ```
   cp .env.example .env.local
   ```

2. Install করুন:
   ```
   npm install
   ```

3. Dev server চালান:
   ```
   npm run dev
   ```
   http://localhost:3000 এ খুলবে।

4. (Optional) প্রথম Admin account বানাতে:
   ```
   npm run seed
   ```
   এটা `.env.local`-এর `ADMIN_EMAIL` / `ADMIN_PASSWORD` (default: admin@polyattend.com / Admin@123) দিয়ে একটা admin বানাবে। Departments প্রথম request-এই auto-seed হয়ে যাবে (TPI-র ৫টা department)।

5. Production build:
   ```
   npm run build
   npm start
   ```

## Deploy (Vercel)
এই app যেকোনো Node hosting-এ (Vercel সহ) সরাসরি deploy করা যায় — আলাদা backend hosting লাগবে না। Vercel-এ শুধু environment variables (`MONGODB_URI`, `JWT_SECRET`, `TEACHER_SECRET_KEY`, SMTP ইত্যাদি) সেট করে দিলেই হবে।

## যা যা অপরিবর্তিত আছে (কোনো ফিচার বাদ যায়নি)
- Login/Register/Email verification (OTP)/Forgot & Reset password
- Admin: Users, Departments, Subjects, Holidays, Reports
- Teacher: Subjects, Manual attendance, QR Scanner + Sessions, Reports, Excel Export
- Student: Dashboard, Attendance history, QR code, Excel report download
- Excel report generation (ExcelJS) — subject-wise, student-wise, class/session-wise
- QR code generate/scan flow, shift/section/department validation logic
- Feedback form (login page) → email পাঠানো
- Friday auto-holiday + custom holiday check
