'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AppSwitcher() {
  const pathname = usePathname();
  const isIsms = pathname.startsWith('/isms');

  return (
    <div
      style={{
        direction: 'ltr',
        display: 'flex',
        alignItems: 'center',
        borderRadius: '10px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.12)',
        fontSize: '12px',
        fontWeight: 700,
        fontFamily: '"Space Grotesk", sans-serif',
      }}
    >
      <Link
        href="/"
        style={{
          padding: '5px 14px',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          backgroundColor: !isIsms ? 'rgba(59,130,246,0.25)' : 'transparent',
          color: !isIsms ? '#93c5fd' : 'rgba(255,255,255,0.4)',
          transition: 'all 0.15s',
        }}
      >
        🛡️ Reports
      </Link>
      <Link
        href="/isms"
        style={{
          padding: '5px 14px',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          backgroundColor: isIsms ? 'rgba(59,130,246,0.25)' : 'transparent',
          color: isIsms ? '#93c5fd' : 'rgba(255,255,255,0.4)',
          transition: 'all 0.15s',
        }}
      >
        📋 ISMS
      </Link>
    </div>
  );
}
