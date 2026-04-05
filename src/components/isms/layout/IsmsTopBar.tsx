'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import AppSwitcher from '@/components/isms/AppSwitcher';
import { useIsmsStore } from '@/store/ismsStore';

function getPageTitle(pathname: string): string {
  if (pathname === '/isms/dashboard') return 'Executive Dashboard';
  if (pathname === '/isms/tasks') return 'Task Board';
  if (pathname === '/isms/risks') return 'Risk Register';
  if (pathname === '/isms/assets') return 'Asset Inventory';
  if (pathname === '/isms/incidents') return 'Incident Log';
  if (pathname === '/isms/audit') return 'Internal Audit';
  if (pathname === '/isms/documents') return 'Documentation Register';
  if (pathname === '/isms/soa') return 'Statement of Applicability';
  if (pathname.startsWith('/isms/clause/')) return 'ISO Clause Management';
  if (pathname.startsWith('/isms/annex/')) return 'Annex A Controls';
  return 'ISO 27001 CISO Command Suite';
}

export default function IsmsTopBar() {
  const pathname = usePathname();
  const title = useMemo(() => getPageTitle(pathname), [pathname]);

  const workspace = useIsmsStore((state) => state.workspace);
  const isLoading = useIsmsStore((state) => state.isLoading);
  const loadAll = useIsmsStore((state) => state.loadAll);

  useEffect(() => {
    if (!workspace && !isLoading) {
      void loadAll();
    }
  }, [workspace, isLoading, loadAll]);

  return (
    <header
      style={{
        height: 'var(--isms-topbar-height)',
        borderBottom: '1px solid var(--isms-border)',
        background: 'var(--isms-bg1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '0 20px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <div>
        <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--isms-txt)' }}>{title}</div>
        <div style={{ fontSize: '11px', color: 'var(--isms-txt3)' }}>
          {workspace?.orgName || 'ISMS Workspace'}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <AppSwitcher />

        <span
          style={{
            color: 'var(--isms-txt2)',
            fontFamily: '"Fira Code", monospace',
            fontSize: '11px',
          }}
        >
          {isLoading ? 'syncing...' : 'ready'}
        </span>

        <Link
          href="/settings"
          style={{
            border: '1px solid var(--isms-border)',
            background: 'var(--isms-bg2)',
            color: 'var(--isms-txt2)',
            borderRadius: '8px',
            textDecoration: 'none',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          Settings
        </Link>
      </div>
    </header>
  );
}
