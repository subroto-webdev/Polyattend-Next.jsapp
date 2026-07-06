import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import ToasterClient from '@/components/common/ToasterClient';

export const metadata = {
  title: {
    default: 'PolyAttend — Thakurgaon Polytechnic Institute',
    template: '%s | PolyAttend',
  },
  description: 'Smart QR-based Attendance Management System for TPI. Teacher ও Student দের জন্য সহজ ও দ্রুত attendance tracking।',
  keywords: [
    'TPI',
    'Thakurgaon Polytechnic Institute',
    'PolyAttend',
    'attendance system',
    'QR attendance',
    'student attendance management',
  ],
  authors: [{ name: 'Subroto' }],
  metadataBase: new URL('https://polyattend-system2026.vercel.app'),
  openGraph: {
    title: 'PolyAttend — Thakurgaon Polytechnic Institute',
    description: 'Smart QR-based Attendance Management System for TPI',
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