'use client';

import { useState } from 'react';
import { FiDownload, FiSave } from 'react-icons/fi';
import { exportIsmsData } from '@/lib/isms/api';
import { useIsmsStore } from '@/store/ismsStore';

export default function IsmsUnsavedBanner() {
  const isDirty = useIsmsStore((state) => state.isDirty);
  const isSavingWorkspace = useIsmsStore((state) => state.isSavingWorkspace);
  const flushWorkspace = useIsmsStore((state) => state.flushWorkspace);

  const [actionError, setActionError] = useState<string | null>(null);

  if (!isDirty && !actionError) {
    return null;
  }

  async function handleSaveNow() {
    setActionError(null);
    try {
      await flushWorkspace();
    } catch (error) {
      console.error('Save from banner failed:', error);
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
      console.error('Export from banner failed:', error);
      setActionError(error instanceof Error ? error.message : 'Export failed');
    }
  }

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 35,
        margin: '8px 24px 0',
        border: '1px solid rgba(245,158,11,0.45)',
        background: 'rgba(245,158,11,0.12)',
        color: 'var(--isms-amber)',
        borderRadius: '10px',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}
    >
      <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '.25px' }}>
        Unsaved changes detected. Save now or export a backup snapshot.
      </div>

      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <button
          type='button'
          onClick={() => void handleSaveNow()}
          disabled={isSavingWorkspace}
          style={{
            border: '1px solid rgba(245,158,11,0.45)',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.05)',
            color: 'var(--isms-amber)',
            padding: '5px 10px',
            fontSize: '11px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            cursor: isSavingWorkspace ? 'not-allowed' : 'pointer',
          }}
        >
          <FiSave size={13} />
          Save Now
        </button>

        <button
          type='button'
          onClick={() => void handleExport()}
          style={{
            border: '1px solid rgba(245,158,11,0.45)',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.05)',
            color: 'var(--isms-amber)',
            padding: '5px 10px',
            fontSize: '11px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
          }}
        >
          <FiDownload size={13} />
          Export
        </button>
      </div>

      {actionError ? (
        <div
          style={{
            position: 'absolute',
            insetInline: '12px',
            bottom: '-22px',
            fontSize: '11px',
            color: 'var(--isms-red)',
            fontFamily: '"Fira Code", monospace',
          }}
        >
          {actionError}
        </div>
      ) : null}
    </div>
  );
}
