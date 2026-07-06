'use client';
import { Toaster } from 'react-hot-toast';

export default function ToasterClient() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3500,
        style: { borderRadius: '12px', background: '#fff', color: '#1e293b', boxShadow: '0 4px 16px rgba(15,23,42,0.08)' },
        success: { iconTheme: { primary: '#059669', secondary: '#fff' } },
        error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
      }}
    />
  );
}
