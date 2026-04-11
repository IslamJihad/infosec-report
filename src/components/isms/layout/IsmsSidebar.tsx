'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import type { IconType } from 'react-icons';
import {
  FiActivity,
  FiAlertCircle,
  FiArchive,
  FiBarChart2,
  FiBriefcase,
  FiCheckSquare,
  FiClipboard,
  FiCompass,
  FiFileText,
  FiFlag,
  FiHome,
  FiLayers,
  FiLifeBuoy,
  FiLink,
  FiPackage,
  FiShield,
  FiTarget,
  FiUsers,
} from 'react-icons/fi';
import { computeComplianceStats, getTaskDueStatus } from '@/lib/isms/calculations';
import { ANNEX_THEME_METADATA } from '@/lib/isms/constants';
import { useIsmsStore } from '@/store/ismsStore';

type NavItem = {
  label: string;
  href: string;
  icon: IconType;
};

const COMMAND_ITEMS: NavItem[] = [
  { label: 'Executive Dashboard', href: '/isms/dashboard', icon: FiHome },
  { label: 'Task Board', href: '/isms/tasks', icon: FiCheckSquare },
  { label: 'Implementation Roadmap', href: '/isms/roadmap', icon: FiTarget },
  { label: 'Daily Checklist', href: '/isms/checklist', icon: FiClipboard },
  { label: 'Board Report', href: '/isms/board-report', icon: FiBarChart2 },
  { label: 'KPI Metrics', href: '/isms/kpis', icon: FiActivity },
  { label: 'Supplier Management', href: '/isms/suppliers', icon: FiLink },
  { label: 'Awareness Programme', href: '/isms/awareness', icon: FiUsers },
];

const CLAUSE_ITEMS: NavItem[] = [
  { label: 'Clause 4 - Context', href: '/isms/clause/4', icon: FiCompass },
  { label: 'Clause 5 - Leadership', href: '/isms/clause/5', icon: FiFlag },
  { label: 'Clause 6 - Planning', href: '/isms/clause/6', icon: FiTarget },
  { label: 'Clause 7 - Support', href: '/isms/clause/7', icon: FiLifeBuoy },
  { label: 'Clause 8 - Operation', href: '/isms/clause/8', icon: FiLayers },
  { label: 'Clause 9 - Evaluation', href: '/isms/clause/9', icon: FiBarChart2 },
  { label: 'Clause 10 - Improvement', href: '/isms/clause/10', icon: FiAlertCircle },
];

const PROCESS_ITEMS: NavItem[] = [
  { label: 'Risk Register', href: '/isms/risks', icon: FiAlertCircle },
  { label: 'Asset Inventory', href: '/isms/assets', icon: FiPackage },
  { label: 'Incident Log', href: '/isms/incidents', icon: FiActivity },
  { label: 'Internal Audit', href: '/isms/audit', icon: FiFileText },
  { label: 'Documentation Register', href: '/isms/documents', icon: FiArchive },
];

const ANNEX_ITEMS: NavItem[] = [
  { label: 'Annex Overview', href: '/isms/annex', icon: FiLayers },
  { label: 'Statement of Applicability', href: '/isms/soa', icon: FiShield },
  {
    label: `${ANNEX_THEME_METADATA['5'].code} - ${ANNEX_THEME_METADATA['5'].shortLabel}`,
    href: '/isms/annex/5',
    icon: FiBriefcase,
  },
  {
    label: `${ANNEX_THEME_METADATA['6'].code} - ${ANNEX_THEME_METADATA['6'].shortLabel}`,
    href: '/isms/annex/6',
    icon: FiUsers,
  },
  {
    label: `${ANNEX_THEME_METADATA['7'].code} - ${ANNEX_THEME_METADATA['7'].shortLabel}`,
    href: '/isms/annex/7',
    icon: FiHome,
  },
  {
    label: `${ANNEX_THEME_METADATA['8'].code} - ${ANNEX_THEME_METADATA['8'].shortLabel}`,
    href: '/isms/annex/8',
    icon: FiActivity,
  },
];

type BadgeTone = 'danger' | 'warning' | 'success';

type NavBadge = {
  value: number;
  tone: BadgeTone;
};

function isActive(pathname: string, href: string): boolean {
  if (href.startsWith('/isms/clause/')) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  if (href === '/isms/annex') {
    return pathname === href;
  }

  if (href.startsWith('/isms/annex/')) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return pathname === href;
}

function badgeStyle(tone: BadgeTone): { bg: string; border: string; color: string } {
  if (tone === 'danger') {
    return {
      bg: 'rgba(239,68,68,0.18)',
      border: 'rgba(239,68,68,0.45)',
      color: 'var(--isms-red)',
    };
  }

  if (tone === 'warning') {
    return {
      bg: 'rgba(245,158,11,0.16)',
      border: 'rgba(245,158,11,0.45)',
      color: 'var(--isms-amber)',
    };
  }

  return {
    bg: 'rgba(34,197,94,0.18)',
    border: 'rgba(34,197,94,0.4)',
    color: 'var(--isms-green)',
  };
}

function NavGroup({
  title,
  items,
  pathname,
  getBadge,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  getBadge: (href: string) => NavBadge | null;
}) {
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
        const badge = getBadge(item.href);
        const Icon = item.icon;
        const badgeColor = badge ? badgeStyle(badge.tone) : null;

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
              transition: 'all 0.12s ease-out',
            }}
          >
            <span style={{ width: '16px', opacity: 0.9, display: 'inline-flex', justifyContent: 'center' }}>
              <Icon size={13} />
            </span>
            <span style={{ lineHeight: 1.2, flex: 1 }}>{item.label}</span>
            {badge && badgeColor ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '18px',
                  height: '18px',
                  padding: '0 6px',
                  borderRadius: '999px',
                  background: badgeColor.bg,
                  border: `1px solid ${badgeColor.border}`,
                  color: badgeColor.color,
                  fontSize: '10px',
                  fontWeight: 700,
                  fontFamily: '"Fira Code", monospace',
                }}
              >
                {badge.value}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}

export default function IsmsSidebar() {
  const pathname = usePathname();

  const workspace = useIsmsStore((state) => state.workspace);
  const tasks = useIsmsStore((state) => state.tasks);
  const risks = useIsmsStore((state) => state.risks);
  const incidents = useIsmsStore((state) => state.incidents);
  const isDirty = useIsmsStore((state) => state.isDirty);
  const isSavingWorkspace = useIsmsStore((state) => state.isSavingWorkspace);
  const lastSavedAt = useIsmsStore((state) => state.lastSavedAt);

  const compliancePct = useMemo(() => {
    if (!workspace) {
      return 0;
    }

    return computeComplianceStats(
      workspace.clauseStatus ?? {},
      workspace.controlStatus ?? {},
    ).overallPct;
  }, [workspace]);

  const overdueTasks = useMemo(
    () => tasks.filter((task) => task.status !== 'done' && getTaskDueStatus(task.dueDate) === 'overdue').length,
    [tasks],
  );

  const openRisks = useMemo(
    () => risks.filter((risk) => risk.status !== 'Closed').length,
    [risks],
  );

  const openIncidents = useMemo(
    () => incidents.filter((incident) => !['Closed', 'Resolved'].includes(incident.status)).length,
    [incidents],
  );

  const saveStateLabel = useMemo(() => {
    if (isSavingWorkspace) {
      return 'Saving...';
    }

    if (isDirty) {
      return 'Unsaved changes';
    }

    if (lastSavedAt) {
      const dt = new Date(lastSavedAt);
      if (!Number.isNaN(dt.getTime())) {
        return `Saved ${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
    }

    return 'Ready';
  }, [isDirty, isSavingWorkspace, lastSavedAt]);

  function navBadge(href: string): NavBadge | null {
    if (href === '/isms/tasks' && overdueTasks > 0) {
      return { value: overdueTasks, tone: 'warning' };
    }

    if (href === '/isms/risks' && openRisks > 0) {
      return { value: openRisks, tone: openRisks >= 3 ? 'danger' : 'warning' };
    }

    if (href === '/isms/incidents' && openIncidents > 0) {
      return { value: openIncidents, tone: openIncidents >= 2 ? 'danger' : 'warning' };
    }

    return null;
  }

  const saveDotColor = isDirty
    ? 'var(--isms-amber)'
    : isSavingWorkspace
      ? 'var(--isms-cyan)'
      : 'var(--isms-green)';

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--isms-blue), var(--isms-cyan))',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f8fbff',
              boxShadow: '0 0 14px rgba(79,142,247,0.35)',
            }}
          >
            <FiShield size={18} />
          </div>

          <div>
            <div style={{ fontFamily: '"Fira Code", monospace', color: 'var(--isms-blue)', fontSize: '11px', marginBottom: '2px' }}>
              ISO 27001
            </div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--isms-txt)' }}>CISO Command Suite</div>
          </div>
        </div>

        <div style={{
          border: '1px solid var(--isms-border)',
          borderRadius: '8px',
          background: 'var(--isms-bg2)',
          padding: '8px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '10px', color: 'var(--isms-txt3)', textTransform: 'uppercase', letterSpacing: '.8px' }}>
              Overall Compliance
            </span>
            <span style={{ fontFamily: '"Fira Code", monospace', fontSize: '11px', color: 'var(--isms-cyan)', fontWeight: 700 }}>
              {compliancePct}%
            </span>
          </div>
          <div style={{ height: '6px', borderRadius: '999px', background: 'var(--isms-bg3)', overflow: 'hidden', border: '1px solid var(--isms-border)' }}>
            <div style={{
              width: `${compliancePct}%`,
              height: '100%',
              borderRadius: '999px',
              background: 'linear-gradient(90deg, var(--isms-blue), var(--isms-cyan))',
              transition: 'width 0.8s cubic-bezier(.4,0,.2,1)',
            }} />
          </div>
        </div>
      </div>

      <div style={{ paddingBottom: '16px' }}>
        <NavGroup title="CISO Command" items={COMMAND_ITEMS} pathname={pathname} getBadge={navBadge} />
        <NavGroup title="ISO 27001:2022" items={CLAUSE_ITEMS} pathname={pathname} getBadge={navBadge} />
        <NavGroup title="ISMS Processes" items={PROCESS_ITEMS} pathname={pathname} getBadge={navBadge} />
        <NavGroup title="Annex A Controls" items={ANNEX_ITEMS} pathname={pathname} getBadge={navBadge} />
      </div>

      <div style={{ marginTop: 'auto', padding: '12px', borderTop: '1px solid var(--isms-border)' }}>
        <div
          style={{
            border: '1px solid var(--isms-border)',
            borderRadius: '8px',
            background: 'var(--isms-bg2)',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span
            style={{
              width: '9px',
              height: '9px',
              borderRadius: '999px',
              background: saveDotColor,
              boxShadow: `0 0 8px ${saveDotColor}`,
              animation: isDirty || isSavingWorkspace ? 'pulse-glow 1.4s infinite' : 'none',
            }}
          />
          <span
            style={{
              fontSize: '11px',
              color: 'var(--isms-txt2)',
              fontFamily: '"Fira Code", monospace',
            }}
          >
            {saveStateLabel}
          </span>
        </div>
      </div>
    </aside>
  );
}
