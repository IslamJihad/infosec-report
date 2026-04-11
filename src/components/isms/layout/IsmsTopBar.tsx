'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, CSSProperties } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  FiBarChart2,
  FiDownload,
  FiLoader,
  FiPrinter,
  FiSave,
  FiSettings,
  FiUpload,
} from 'react-icons/fi';
import AppSwitcher from '@/components/isms/AppSwitcher';
import ThemeToggle from '@/components/theme/ThemeToggle';
import { exportIsmsData } from '@/lib/isms/api';
import { useIsmsStore } from '@/store/ismsStore';

type PageMeta = {
  title: string;
  subtitle: string;
};

function getPageMeta(pathname: string): PageMeta {
  if (pathname === '/isms/dashboard') {
    return { title: 'Executive Dashboard', subtitle: 'ISO 27001:2022 real-time overview' };
  }

  if (pathname === '/isms/tasks') {
    return { title: 'Task Board', subtitle: 'Operational implementation workflow and due-date focus' };
  }

  if (pathname === '/isms/risks') {
    return { title: 'Risk Register', subtitle: 'Likelihood-impact scoring, ownership, and treatment tracking' };
  }

  if (pathname === '/isms/assets') {
    return { title: 'Asset Inventory', subtitle: 'Critical information assets and protection posture' };
  }

  if (pathname === '/isms/incidents') {
    return { title: 'Incident Log', subtitle: 'Security events, response actions, and learning loop' };
  }

  if (pathname === '/isms/audit') {
    return { title: 'Internal Audit', subtitle: 'Audit programme and nonconformity tracking' };
  }

  if (pathname === '/isms/documents') {
    return { title: 'Documentation Register', subtitle: 'Mandatory and supporting ISMS documentation status' };
  }

  if (pathname === '/isms/soa') {
    return { title: 'Statement of Applicability', subtitle: 'Control applicability and implementation evidence' };
  }

  if (pathname.startsWith('/isms/clause/')) {
    return { title: 'ISO Clause Management', subtitle: 'Clause-level implementation tracking and guidance notes' };
  }

  if (pathname === '/isms/annex') {
    return { title: 'Annex A Overview', subtitle: 'Navigate control themes and Statement of Applicability' };
  }

  if (pathname.startsWith('/isms/annex/')) {
    return { title: 'Annex A Controls', subtitle: 'Control theme tracking across A.5 to A.8 domains' };
  }

  if (pathname === '/isms/board-report') {
    return { title: 'Board Report', subtitle: 'Executive summary for management review and board updates' };
  }

  return { title: 'ISO 27001 CISO Command Suite', subtitle: 'Integrated command center for ISMS governance' };
}

function topbarButtonStyle(disabled: boolean): CSSProperties {
  return {
    border: '1px solid var(--isms-border)',
    background: disabled ? 'var(--isms-bg2)' : 'var(--isms-bg3)',
    color: disabled ? 'var(--isms-txt3)' : 'var(--isms-txt2)',
    borderRadius: '8px',
    textDecoration: 'none',
    padding: '6px 10px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.12s ease-out',
  };
}

export default function IsmsTopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const page = useMemo(() => getPageMeta(pathname), [pathname]);

  const importRef = useRef<HTMLInputElement | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const workspace = useIsmsStore((state) => state.workspace);
  const isLoading = useIsmsStore((state) => state.isLoading);
  const isDirty = useIsmsStore((state) => state.isDirty);
  const isSavingWorkspace = useIsmsStore((state) => state.isSavingWorkspace);
  const lastSavedAt = useIsmsStore((state) => state.lastSavedAt);
  const lastWorkspaceError = useIsmsStore((state) => state.lastWorkspaceError);
  const loadAll = useIsmsStore((state) => state.loadAll);
  const flushWorkspace = useIsmsStore((state) => state.flushWorkspace);
  const importSnapshot = useIsmsStore((state) => state.importSnapshot);

  useEffect(() => {
    if (!workspace && !isLoading) {
      void loadAll();
    }
  }, [workspace, isLoading, loadAll]);

  const statusLabel = useMemo(() => {
    if (isLoading || isSavingWorkspace) {
      return 'syncing';
    }

    if (isDirty) {
      return 'unsaved changes';
    }

    if (lastSavedAt) {
      const dt = new Date(lastSavedAt);
      if (!Number.isNaN(dt.getTime())) {
        return `saved ${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
    }

    return 'ready';
  }, [isDirty, isLoading, isSavingWorkspace, lastSavedAt]);

  const statusColor = isDirty
    ? 'var(--isms-amber)'
    : lastWorkspaceError
      ? 'var(--isms-red)'
      : isSavingWorkspace
        ? 'var(--isms-cyan)'
        : 'var(--isms-green)';

  async function handleSaveNow() {
    setActionError(null);
    try {
      await flushWorkspace();
    } catch (error) {
      console.error('Save action failed:', error);
      setActionError(error instanceof Error ? error.message : 'Save failed');
    }
  }

  async function handleExport() {
    setActionError(null);
    try {
      const data = await exportIsmsData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `isms-export-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch (error) {
      console.error('Export action failed:', error);
      setActionError(error instanceof Error ? error.message : 'Export failed');
    }
  }

  function handleImportClick() {
    importRef.current?.click();
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setActionError(null);
      const raw = await file.text();
      const parsed = JSON.parse(raw) as unknown;
      await importSnapshot(parsed);
    } catch (error) {
      console.error('Import action failed:', error);
      setActionError(error instanceof Error ? error.message : 'Import failed');
    } finally {
      event.currentTarget.value = '';
    }
  }

  return (
    <header
      style={{
        minHeight: 'var(--isms-topbar-height)',
        borderBottom: '1px solid var(--isms-border)',
        background: 'var(--isms-bg1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px',
        padding: '0 20px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <div>
        <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--isms-txt)' }}>{page.title}</div>
        <div style={{ fontSize: '11px', color: 'var(--isms-txt3)' }}>{page.subtitle}</div>
        <div style={{ fontSize: '11px', color: 'var(--isms-txt3)', marginTop: '1px' }}>
          {workspace?.orgName || 'ISMS Workspace'}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <AppSwitcher />
        <ThemeToggle compact />

        <button type='button' style={topbarButtonStyle(false)} onClick={() => router.push('/isms/board-report')}>
          <FiBarChart2 size={14} />
          Board View
        </button>

        <button type='button' style={topbarButtonStyle(false)} onClick={() => window.print()}>
          <FiPrinter size={14} />
          Print
        </button>

        <button
          type='button'
          style={topbarButtonStyle(isLoading || isSavingWorkspace || !isDirty)}
          onClick={() => void handleSaveNow()}
          disabled={isLoading || isSavingWorkspace || !isDirty}
        >
          {isSavingWorkspace ? <FiLoader size={14} /> : <FiSave size={14} />}
          Save
        </button>

        <button type='button' style={topbarButtonStyle(false)} onClick={() => void handleExport()}>
          <FiDownload size={14} />
          Export
        </button>

        <button type='button' style={topbarButtonStyle(false)} onClick={handleImportClick}>
          <FiUpload size={14} />
          Import
        </button>

        <button type='button' style={topbarButtonStyle(false)} onClick={() => router.push('/settings')}>
          <FiSettings size={14} />
          Settings
        </button>

        <input
          ref={importRef}
          type='file'
          accept='application/json,.json'
          hidden
          onChange={(event) => void handleImportFile(event)}
        />

        <span
          style={{
            color: statusColor,
            fontFamily: '"Fira Code", monospace',
            fontSize: '11px',
            minWidth: '140px',
            textAlign: 'right',
          }}
        >
          {statusLabel}
        </span>
      </div>

      {(actionError || lastWorkspaceError) && (
        <div
          style={{
            position: 'absolute',
            insetInline: '20px',
            bottom: '-30px',
            fontSize: '11px',
            color: 'var(--isms-red)',
            fontFamily: '"Fira Code", monospace',
          }}
        >
          {actionError || lastWorkspaceError}
        </div>
      )}
    </header>
  );
}
