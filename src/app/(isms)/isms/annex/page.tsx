'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import type { ControlStatus, SoaEntry } from '@/types/isms';
import { ANNEX_A_CONTROLS, ANNEX_THEME_METADATA, ANNEX_THEME_ORDER } from '@/lib/isms/constants';
import { useIsmsStore } from '@/store/ismsStore';

const EMPTY_CONTROL_STATUS: Record<string, ControlStatus> = {};
const EMPTY_SOA_DATA: Record<string, SoaEntry> = {};

export default function AnnexOverviewPage() {
  const workspace = useIsmsStore((state) => state.workspace);
  const loadAll = useIsmsStore((state) => state.loadAll);

  useEffect(() => {
    if (!workspace) {
      void loadAll();
    }
  }, [workspace, loadAll]);

  const controlStatus = workspace?.controlStatus ?? EMPTY_CONTROL_STATUS;
  const soaData = workspace?.soaData ?? EMPTY_SOA_DATA;

  const themeRows = useMemo(
    () =>
      ANNEX_THEME_ORDER.map((theme) => {
        const controls = ANNEX_A_CONTROLS.filter((control) => control.theme === theme);
        const applicable = controls.filter((control) => {
          const entry = (soaData[control.id] as SoaEntry | undefined) ?? { applicable: true, justification: '' };
          return entry.applicable;
        }).length;

        const implemented = controls.filter(
          (control) => controlStatus[control.id] === 'implemented',
        ).length;

        return {
          theme,
          total: controls.length,
          applicable,
          implemented,
          ...ANNEX_THEME_METADATA[theme],
        };
      }),
    [controlStatus, soaData],
  );

  const totals = useMemo(() => {
    return themeRows.reduce(
      (acc, row) => {
        acc.total += row.total;
        acc.applicable += row.applicable;
        acc.implemented += row.implemented;
        return acc;
      },
      { total: 0, applicable: 0, implemented: 0 },
    );
  }, [themeRows]);

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <div
        style={{
          border: '1px solid var(--isms-border)',
          borderRadius: '12px',
          background: 'var(--isms-surf)',
          padding: '16px',
          display: 'grid',
          gap: '10px',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Annex A Overview</h2>
        <p style={{ margin: 0, color: 'var(--isms-txt2)', fontSize: '13px' }}>
          Navigate A.5 to A.8 control themes and maintain applicability evidence in the Statement of Applicability.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontFamily: '"Fira Code", monospace', fontSize: '12px' }}>
          <span style={{ border: '1px solid var(--isms-border)', borderRadius: '999px', background: 'var(--isms-bg3)', padding: '4px 10px' }}>
            Total Controls: {totals.total}
          </span>
          <span style={{ border: '1px solid var(--isms-border)', borderRadius: '999px', background: 'var(--isms-bg3)', padding: '4px 10px' }}>
            Applicable: {totals.applicable}
          </span>
          <span style={{ border: '1px solid var(--isms-border)', borderRadius: '999px', background: 'var(--isms-bg3)', padding: '4px 10px' }}>
            Implemented: {totals.implemented}
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <Link
            href='/isms/soa'
            style={{
              border: '1px solid rgba(59,130,246,0.45)',
              borderRadius: '8px',
              background: 'rgba(59,130,246,0.15)',
              color: '#93c5fd',
              textDecoration: 'none',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            Open Statement of Applicability
          </Link>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '10px',
        }}
      >
        {themeRows.map((row) => {
          const progressPct = row.total === 0 ? 0 : Math.round((row.implemented / row.total) * 100);

          return (
            <div
              key={row.theme}
              style={{
                border: '1px solid var(--isms-border)',
                borderRadius: '12px',
                background: 'var(--isms-surf)',
                padding: '14px',
                display: 'grid',
                gap: '8px',
              }}
            >
              <div style={{ display: 'grid', gap: '2px' }}>
                <div style={{ fontFamily: '"Fira Code", monospace', color: 'var(--isms-cyan)', fontSize: '12px' }}>
                  {row.code}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 600 }}>{row.label}</div>
              </div>

              <div style={{ color: 'var(--isms-txt2)', fontSize: '12px', minHeight: '34px' }}>{row.description}</div>

              <div style={{ display: 'grid', gap: '4px', fontFamily: '"Fira Code", monospace', fontSize: '12px' }}>
                <div style={{ color: 'var(--isms-txt2)' }}>Controls: {row.total}</div>
                <div style={{ color: 'var(--isms-txt2)' }}>Applicable: {row.applicable}</div>
                <div style={{ color: 'var(--isms-txt2)' }}>Implemented: {row.implemented} ({progressPct}%)</div>
              </div>

              <Link
                href={`/isms/annex/${row.theme}`}
                style={{
                  marginTop: '4px',
                  border: '1px solid var(--isms-border)',
                  borderRadius: '8px',
                  background: 'var(--isms-bg3)',
                  color: 'var(--isms-txt)',
                  textDecoration: 'none',
                  padding: '7px 10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  textAlign: 'center',
                }}
              >
                Open {row.code}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
