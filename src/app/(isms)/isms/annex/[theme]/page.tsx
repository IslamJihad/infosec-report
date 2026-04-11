'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import type { ControlStatus, SoaEntry } from '@/types/isms';
import { ANNEX_A_CONTROLS, ANNEX_THEME_METADATA } from '@/lib/isms/constants';
import { useIsmsStore } from '@/store/ismsStore';
import EmptyState from '@/components/isms/shared/EmptyState';
import ControlStatusPill from '@/components/isms/shared/ControlStatusPill';

export default function AnnexThemePage() {
  const params = useParams<{ theme: string }>();
  const theme = Array.isArray(params.theme) ? params.theme[0] : params.theme;
  const isValidTheme = theme === '5' || theme === '6' || theme === '7' || theme === '8';

  const workspace = useIsmsStore((state) => state.workspace);
  const loadAll = useIsmsStore((state) => state.loadAll);
  const updateWorkspace = useIsmsStore((state) => state.updateWorkspace);

  useEffect(() => {
    if (!workspace) {
      void loadAll();
    }
  }, [workspace, loadAll]);

  const controls = useMemo(
    () => ANNEX_A_CONTROLS.filter((control) => control.theme === theme),
    [theme],
  );

  if (!isValidTheme) {
    return <EmptyState title="Theme not found" description="Select Annex A.5 to A.8 from the Annex section." />;
  }

  const activeTheme = theme as keyof typeof ANNEX_THEME_METADATA;
  const themeMeta = ANNEX_THEME_METADATA[activeTheme];

  const controlStatus = workspace?.controlStatus ?? {};
  const soaData = workspace?.soaData ?? {};
  const applicableCount = controls.filter((control) => {
    const entry = (soaData[control.id] as SoaEntry | undefined) ?? { applicable: true, justification: '' };
    return entry.applicable;
  }).length;

  function setControlStatus(controlId: string, status: ControlStatus) {
    void updateWorkspace({
      controlStatus: {
        ...controlStatus,
        [controlId]: status,
      },
    });
  }

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <div
        style={{
          border: '1px solid var(--isms-border)',
          borderRadius: '12px',
          background: 'var(--isms-surf)',
          padding: '16px',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
          {themeMeta.code} {themeMeta.label}
        </h2>
        <p style={{ margin: '8px 0 0', color: 'var(--isms-txt2)', fontSize: '13px' }}>
          {themeMeta.description}
        </p>
        <p style={{ margin: '4px 0 0', color: 'var(--isms-txt2)', fontSize: '13px' }}>
          {controls.length} controls | {applicableCount} marked applicable in SoA.
        </p>

        <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <Link
            href='/isms/annex'
            style={{
              border: '1px solid var(--isms-border)',
              borderRadius: '8px',
              background: 'var(--isms-bg3)',
              color: 'var(--isms-txt)',
              textDecoration: 'none',
              padding: '6px 10px',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            Back to Annex Overview
          </Link>

          <Link
            href='/isms/soa'
            style={{
              border: '1px solid rgba(59,130,246,0.45)',
              borderRadius: '8px',
              background: 'rgba(59,130,246,0.15)',
              color: '#93c5fd',
              textDecoration: 'none',
              padding: '6px 10px',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            Open Statement of Applicability
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '8px' }}>
        {controls.map((control) => {
          const status = controlStatus[control.id] ?? 'not-started';
          const soaEntry = (soaData[control.id] as SoaEntry | undefined) ?? { applicable: true, justification: '' };

          return (
            <div
              key={control.id}
              style={{
                border: '1px solid var(--isms-border)',
                borderRadius: '10px',
                background: 'var(--isms-surf)',
                padding: '12px',
                display: 'grid',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: '"Fira Code", monospace', color: 'var(--isms-txt3)', fontSize: '11px' }}>
                    {control.id}
                  </div>
                  <div style={{ fontWeight: 600 }}>{control.title}</div>
                </div>

                <ControlStatusPill
                  value={status}
                  onChange={(next) => setControlStatus(control.id, next as ControlStatus)}
                  disabled={!soaEntry.applicable}
                />
              </div>

              <div style={{ color: 'var(--isms-txt2)', fontSize: '13px' }}>{control.description}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                <span style={{ color: 'var(--isms-cyan)', fontSize: '11px', fontFamily: '"Fira Code", monospace' }}>{control.type}</span>
                <span
                  style={{
                    border: '1px solid var(--isms-border)',
                    borderRadius: '999px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    color: soaEntry.applicable ? 'var(--isms-green)' : 'var(--isms-amber)',
                    background: 'var(--isms-bg3)',
                    fontFamily: '"Fira Code", monospace',
                  }}
                >
                  {soaEntry.applicable ? 'Applicable' : 'Not Applicable'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
