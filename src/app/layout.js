import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import ToasterClient from '@/components/common/ToasterClient';

export const metadata = {
  title: {
    default: 'PolyAttend — Thakurgaon Polytechnic Institute',
    template: '%s | PolyAttend',
  },
  description: 'PolyAttend হলো Thakurgaon Polytechnic Institute (TPI)-এর জন্য তৈরি একটি Smart QR-based Attendance Management System। Teacher ও Student দের জন্য সহজ ও দ্রুত অনলাইন হাজিরা (attendance) ট্র্যাকিং, ডিজিটাল উপস্থিতি ব্যবস্থাপনা এবং রিয়েল-টাইম রিপোর্টিং সুবিধা।',
  keywords: [
    // Brand
    'PolyAttend',
    'PolyAttend TPI',
    'PolyAttend login',
    'PolyAttend app',
    'PolyAttend Thakurgaon',

    // Institute short
    'TPI',
    'TPI attendance',
    'TPI login',
    'TPI portal',
    'TPI app',
    'TPI QR',
    'TPI student',
    'TPI teacher',
    'TPI hazira',
    'TPI CST',
    'TPI department',
    'TPI result',
    'TPI notice',
    'TPI website',
    'TPI online',

    // Full institute name variants
    'Thakurgaon Polytechnic',
    'Thakurgaon Polytechnic Institute',
    'Thakurgaon Polytechnic attendance',
    'Thakurgaon Polytechnic login',
    'Thakurgaon Polytechnic student',
    'Thakurgaon Polytechnic QR',
    'Thakurgaon Polytechnic app',
    'Thakurgaon Polytechnic portal',
    'Thakurgaon Polytechnic hazira',
    'Thakurgaon Polytechnic CST',
    'Thakurgaon Polytechnic QR attendance',

    // Bengali variants
    'ঠাকুরগাঁও পলিটেকনিক',
    'ঠাকুরগাঁও পলিটেকনিক ইনস্টিটিউট',
    'ঠাকুরগাঁও পলিটেকনিক হাজিরা',
    'ঠাকুরগাঁও পলিটেকনিক লগইন',
    'ঠাকুরগাঁও পলিটেকনিক অ্যাটেন্ডেন্স',
    'ঠাকুরগাঁও পলিটেকনিক attendance system',
    'ঠাকুরগাঁও পলিটেকনিক অ্যাপ',
    'ঠাকুরগাঁও পলিটেকনিক ছাত্র',
    'পলিটেকনিক হাজিরা সিস্টেম',
    'পলিটেকনিক অনলাইন হাজিরা',
    'পলিটেকনিক QR হাজিরা',
    'অনলাইন হাজিরা ব্যবস্থা',
    'ডিজিটাল উপস্থিতি পলিটেকনিক',

    // Attendance generic
    'attendance system',
    'attendance app',
    'attendance management',
    'attendance tracker',
    'attendance portal',
    'online attendance',
    'digital attendance',
    'smart attendance',
    'automatic attendance',
    'attendance dashboard',
    'attendance report',
    'attendance software',
    'student attendance',
    'student attendance management',
    'teacher attendance',
    'teacher attendance dashboard',
    'class attendance',
    'college attendance',
    'school attendance',
    'attendance checker',
    'attendance calculator',
    'daily attendance',

    // QR based
    'QR attendance',
    'QR code attendance',
    'QR attendance system',
    'QR attendance app',
    'QR code hazira',
    'QR code hazira system',
    'QR scan attendance',
    'QR based attendance system',
    'QR login system',
    'QR code attendance system for college',

    // Polytechnic generic
    'polytechnic attendance',
    'polytechnic attendance management system Bangladesh',
    'polytechnic login',
    'polytechnic student portal',
    'polytechnic app',
    'polytechnic system',
    'polytechnic institute app',
    'polytechnic institute Bangladesh',
    'polytechnic Bangladesh',
    'polytechnic result',
    'diploma attendance',
    'diploma engineering attendance',
    'diploma student portal',

    // BTEB related
    'BTEB attendance',
    'BTEB student attendance system',
    'BTEB student system',
    'BTEB portal',
    'BTEB login',

    // Department related
    'CST attendance',
    'CST department TPI',
    'Computer Science Technology TPI',
    'polytechnic CST',

    // Action / intent keywords
    'attendance system কিভাবে চেক করব',
    'TPI attendance কিভাবে দেখব',
    'ঠাকুরগাঁও পলিটেকনিক এর অ্যাটেন্ডেন্স সিস্টেম কিভাবে চেক করব',
    'polytechnic hazira app',
    'attendance app download',
    'TPI app download',
    'TPI attendance app download',
    'how to check attendance TPI',
    'student login system',
    'teacher login system',
    'school management system Bangladesh',
    'attendance system Bangladesh',
    'best attendance app Bangladesh',
    'free attendance system',
    'web based attendance system',
    'student attendance app Bangladesh',
    'Next.js attendance system',
  ],
  authors: [{ name: 'Subroto' }],
  metadataBase: new URL('https://polyattend-system2026.vercel.app'),
  openGraph: {
    title: 'PolyAttend — Thakurgaon Polytechnic Institute',
    description: 'Smart QR-based Attendance Management System for TPI. Teacher ও Student দের জন্য সহজ ও দ্রুত attendance tracking।',
    url: 'https://polyattend-system2026.vercel.app',
    siteName: 'PolyAttend',
    locale: 'en_US',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: 'Rv-warpxyxgzIEGN5-ulYl0zJ3IfODOf1AjL_X9Ibjg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <ToasterClient />
        </AuthProvider>
      </body>
    </html>
  );
}