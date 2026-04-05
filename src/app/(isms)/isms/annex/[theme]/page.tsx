'use client';

import { useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import type { ControlStatus } from '@/types/isms';
import { ANNEX_A_CONTROLS } from '@/lib/isms/constants';
import { useIsmsStore } from '@/store/ismsStore';
import EmptyState from '@/components/isms/shared/EmptyState';
import ControlStatusPill from '@/components/isms/shared/ControlStatusPill';

export default function AnnexThemePage() {
  const params = useParams<{ theme: string }>();
  const theme = Array.isArray(params.theme) ? params.theme[0] : params.theme;

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

  if (!['5', '6', '7', '8'].includes(theme)) {
    return <EmptyState title="Theme not found" description="Select Annex A.5 to A.8 from the quick links." />;
  }

  const controlStatus = workspace?.controlStatus ?? {};

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
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Annex A.{theme} Controls</h2>
        <p style={{ margin: '8px 0 0', color: 'var(--isms-txt2)', fontSize: '13px' }}>
          {controls.length} controls in this theme.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '8px' }}>
        {controls.map((control) => {
          const status = controlStatus[control.id] ?? 'not-started';

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
                />
              </div>

              <div style={{ color: 'var(--isms-txt2)', fontSize: '13px' }}>{control.description}</div>
              <div style={{ color: 'var(--isms-cyan)', fontSize: '11px', fontFamily: '"Fira Code", monospace' }}>{control.type}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
