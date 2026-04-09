'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AppSwitcher() {
  const pathname = usePathname();
  const isIsms = pathname === '/isms' || pathname.startsWith('/isms/');

  return (
    <div
      style={{
        direction: 'ltr',
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        padding: '2px',
        borderRadius: '12px',
        border: '1px solid #cbd5e1',
        backgroundColor: 'rgba(255,255,255,0.96)',
        fontSize: '12px',
        fontWeight: 700,
        fontFamily: '"Space Grotesk", sans-serif',
        boxShadow: '0 1px 4px rgba(15, 23, 42, 0.08)',
      }}
    >
      <Link
        href="/"
        style={{
          padding: '6px 12px',
          borderRadius: '9px',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          backgroundColor: !isIsms ? '#2563eb' : 'transparent',
          color: !isIsms ? '#ffffff' : '#334155',
          transition: 'all 0.15s',
        }}
      >
        🛡️ Reports
      </Link>
      <Link
        href="/isms/dashboard"
        style={{
          padding: '6px 12px',
          borderRadius: '9px',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          backgroundColor: isIsms ? '#2563eb' : 'transparent',
          color: isIsms ? '#ffffff' : '#334155',
          transition: 'all 0.15s',
        }}
      >
        📋 ISMS
      </Link>
    </div>
  );
}
