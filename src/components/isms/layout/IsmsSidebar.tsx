'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = {
  label: string;
  href: string;
  icon?: string;
};

const COMMAND_ITEMS: NavItem[] = [
  { label: 'Executive Dashboard', href: '/isms/dashboard', icon: '▦' },
  { label: 'Task Board', href: '/isms/tasks', icon: '☰' },
  { label: 'Implementation Roadmap', href: '/isms/roadmap', icon: '◷' },
  { label: 'Daily Checklist', href: '/isms/checklist', icon: '✓' },
  { label: 'Board Report', href: '/isms/board-report', icon: '▣' },
  { label: 'KPI Metrics', href: '/isms/kpis', icon: '◴' },
  { label: 'Supplier Management', href: '/isms/suppliers', icon: '⛓' },
  { label: 'Awareness Programme', href: '/isms/awareness', icon: '◉' },
];

const CLAUSE_ITEMS: NavItem[] = [
  { label: 'Clause 4 - Context', href: '/isms/clause/4' },
  { label: 'Clause 5 - Leadership', href: '/isms/clause/5' },
  { label: 'Clause 6 - Planning', href: '/isms/clause/6' },
  { label: 'Clause 7 - Support', href: '/isms/clause/7' },
  { label: 'Clause 8 - Operation', href: '/isms/clause/8' },
  { label: 'Clause 9 - Evaluation', href: '/isms/clause/9' },
  { label: 'Clause 10 - Improvement', href: '/isms/clause/10' },
  { label: 'Statement of Applicability', href: '/isms/soa' },
];

const PROCESS_ITEMS: NavItem[] = [
  { label: 'Risk Register', href: '/isms/risks' },
  { label: 'Asset Inventory', href: '/isms/assets' },
  { label: 'Incident Log', href: '/isms/incidents' },
  { label: 'Internal Audit', href: '/isms/audit' },
  { label: 'Documentation Register', href: '/isms/documents' },
];

const ANNEX_QUICK_LINKS: NavItem[] = [
  { label: 'A.5', href: '/isms/annex/5' },
  { label: 'A.6', href: '/isms/annex/6' },
  { label: 'A.7', href: '/isms/annex/7' },
  { label: 'A.8', href: '/isms/annex/8' },
];

function isActive(pathname: string, href: string): boolean {
  if (href.startsWith('/isms/clause/')) {
    return pathname.startsWith('/isms/clause/');
  }

  if (href.startsWith('/isms/annex/')) {
    return pathname.startsWith('/isms/annex/');
  }

  return pathname === href;
}

function NavGroup({ title, items, pathname }: { title: string; items: NavItem[]; pathname: string }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div
        style={{
          padding: '12px 14px 6px',
          fontSize: '10px',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          color: 'var(--isms-txt3)',
          fontFamily: '"Fira Code", monospace',
        }}
      >
        {title}
      </div>

      {items.map((item) => {
        const active = isActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: '2px 8px',
              borderRadius: '8px',
              border: active ? '1px solid rgba(59,130,246,0.45)' : '1px solid transparent',
              background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: active ? 'var(--isms-txt)' : 'var(--isms-txt2)',
              textDecoration: 'none',
              fontSize: '13px',
              padding: '8px 10px',
            }}
          >
            <span style={{ width: '16px', opacity: 0.85 }}>{item.icon ?? '•'}</span>
            <span style={{ lineHeight: 1.2 }}>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export default function IsmsSidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 'var(--isms-sidebar-width)',
        borderRight: '1px solid var(--isms-border)',
        background: 'var(--isms-bg1)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ padding: '18px 16px 12px', borderBottom: '1px solid var(--isms-border)' }}>
        <div style={{ fontFamily: '"Fira Code", monospace', color: 'var(--isms-blue)', fontSize: '12px', marginBottom: '4px' }}>
          ISO 27001
        </div>
        <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--isms-txt)' }}>CISO Command Suite</div>
      </div>

      <div style={{ paddingBottom: '16px' }}>
        <NavGroup title="CISO Command" items={COMMAND_ITEMS} pathname={pathname} />
        <NavGroup title="ISO 27001:2022" items={CLAUSE_ITEMS} pathname={pathname} />
        <NavGroup title="ISMS Processes" items={PROCESS_ITEMS} pathname={pathname} />
      </div>

      <div style={{ marginTop: 'auto', padding: '12px', borderTop: '1px solid var(--isms-border)' }}>
        <div
          style={{
            marginBottom: '8px',
            color: 'var(--isms-txt3)',
            fontFamily: '"Fira Code", monospace',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            fontSize: '10px',
          }}
        >
          Annex A
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
          {ANNEX_QUICK_LINKS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  textAlign: 'center',
                  borderRadius: '8px',
                  padding: '6px 0',
                  textDecoration: 'none',
                  border: active ? '1px solid rgba(59,130,246,0.5)' : '1px solid var(--isms-border)',
                  color: active ? '#93c5fd' : 'var(--isms-txt2)',
                  background: active ? 'rgba(59,130,246,0.18)' : 'var(--isms-bg2)',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
