'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AppSwitcher() {
  const pathname = usePathname();
  const isIsms = pathname === '/isms' || pathname.startsWith('/isms/');

  const linkBaseStyle = {
    padding: '6px 12px',
    borderRadius: '9px',
    textDecoration: 'none',
    whiteSpace: 'nowrap' as const,
    transition: 'all 0.15s',
  };

  return (
    <div
      style={{
        direction: 'ltr',
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        padding: '2px',
        borderRadius: '12px',
        border: '1px solid var(--theme-switcher-border)',
        backgroundColor: 'var(--theme-switcher-bg)',
        fontSize: '12px',
        fontWeight: 700,
        fontFamily: '"Space Grotesk", sans-serif',
        boxShadow: 'var(--theme-switcher-shadow)',
      }}
    >
      <Link
        href="/"
        style={{
          ...linkBaseStyle,
          backgroundColor: !isIsms ? 'var(--theme-switcher-active-bg)' : 'transparent',
          color: !isIsms ? 'var(--theme-switcher-active-text)' : 'var(--theme-switcher-text)',
        }}
      >
        🛡️ Reports
      </Link>
      <Link
        href="/isms/dashboard"
        style={{
          ...linkBaseStyle,
          backgroundColor: isIsms ? 'var(--theme-switcher-active-bg)' : 'transparent',
          color: isIsms ? 'var(--theme-switcher-active-text)' : 'var(--theme-switcher-text)',
        }}
      >
        📋 ISMS
      </Link>
    </div>
  );
}
