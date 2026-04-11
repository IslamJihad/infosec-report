'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { ControlStatus, SoaEntry } from '@/types/isms';
import { ANNEX_A_CONTROLS, ANNEX_THEME_METADATA, ANNEX_THEME_ORDER } from '@/lib/isms/constants';
import { useIsmsStore } from '@/store/ismsStore';

const STATUS_OPTIONS: Array<{ value: ControlStatus; label: string }> = [
  { value: 'not-started', label: 'Not Started' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'implemented', label: 'Implemented' },
];

const EMPTY_CONTROL_STATUS: Record<string, ControlStatus> = {};
const EMPTY_SOA_DATA: Record<string, SoaEntry> = {};

export default function SoaPage() {
  const workspace = useIsmsStore((state) => state.workspace);
  const loadAll = useIsmsStore((state) => state.loadAll);
  const updateWorkspace = useIsmsStore((state) => state.updateWorkspace);

  const [query, setQuery] = useState('');
  const [themeFilter, setThemeFilter] = useState<'all' | '5' | '6' | '7' | '8'>('all');
  const [applicableFilter, setApplicableFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ControlStatus>('all');

  useEffect(() => {
    if (!workspace) {
      void loadAll();
    }
  }, [workspace, loadAll]);

  const controlStatus = workspace?.controlStatus ?? EMPTY_CONTROL_STATUS;
  const soaData = workspace?.soaData ?? EMPTY_SOA_DATA;

  const controls = useMemo(() => {
    return ANNEX_A_CONTROLS.filter((control) => {
      const soa = (soaData[control.id] as SoaEntry | undefined) ?? { applicable: true, justification: '' };
      const status = controlStatus[control.id] ?? 'not-started';
      const text = `${control.id} ${control.title}`.toLowerCase();

      if (query && !text.includes(query.toLowerCase())) return false;
      if (themeFilter !== 'all' && control.theme !== themeFilter) return false;
      if (applicableFilter === 'yes' && !soa.applicable) return false;
      if (applicableFilter === 'no' && soa.applicable) return false;
      if (statusFilter !== 'all' && status !== statusFilter) return false;

      return true;
    });
  }, [query, themeFilter, applicableFilter, statusFilter, controlStatus, soaData]);

  const applicableCount = ANNEX_A_CONTROLS.filter((control) => {
    const entry = (soaData[control.id] as SoaEntry | undefined) ?? { applicable: true, justification: '' };
    return entry.applicable;
  }).length;

  const implementedCount = ANNEX_A_CONTROLS.filter(
    (control) => controlStatus[control.id] === 'implemented',
  ).length;

  const notStartedCount = ANNEX_A_CONTROLS.filter(
    (control) => (controlStatus[control.id] ?? 'not-started') === 'not-started',
  ).length;

  const themeLinks = useMemo(
    () => ANNEX_THEME_ORDER.map((theme) => ({ theme, ...ANNEX_THEME_METADATA[theme] })),
    [],
  );

  function setApplicable(controlId: string, applicable: boolean) {
    const current = (soaData[controlId] as SoaEntry | undefined) ?? { applicable: true, justification: '' };
    void updateWorkspace({
      soaData: {
        ...soaData,
        [controlId]: {
          ...current,
          applicable,
        },
      },
    });
  }

  function setStatus(controlId: string, status: ControlStatus) {
    void updateWorkspace({
      controlStatus: {
        ...controlStatus,
        [controlId]: status,
      },
    });
  }

  function setJustification(controlId: string, justification: string) {
    const current = (soaData[controlId] as SoaEntry | undefined) ?? { applicable: true, justification: '' };
    void updateWorkspace({
      soaData: {
        ...soaData,
        [controlId]: {
          ...current,
          justification,
        },
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
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Statement of Applicability</h2>
        <p style={{ margin: '8px 0 0', color: 'var(--isms-txt2)', fontSize: '13px' }}>
          {applicableCount} Applicable | {implementedCount} Implemented | {notStartedCount} Not Started
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

          {themeLinks.map((item) => (
            <Link
              key={item.theme}
              href={`/isms/annex/${item.theme}`}
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
              {item.code} {item.shortLabel}
            </Link>
          ))}
        </div>
      </div>

      <div
        style={{
          border: '1px solid var(--isms-border)',
          borderRadius: '12px',
          background: 'var(--isms-surf)',
          padding: '12px',
          display: 'grid',
          gridTemplateColumns: '2fr repeat(3, 1fr)',
          gap: '8px',
        }}
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search controls"
          style={{
            border: '1px solid var(--isms-border)',
            borderRadius: '8px',
            background: 'var(--isms-bg3)',
            color: 'var(--isms-txt)',
            padding: '8px 10px',
          }}
        />

        <select value={themeFilter} onChange={(event) => setThemeFilter(event.target.value as typeof themeFilter)} style={{ border: '1px solid var(--isms-border)', borderRadius: '8px', background: 'var(--isms-bg3)', color: 'var(--isms-txt)', padding: '8px 10px' }}>
          <option value="all">All Themes</option>
          {ANNEX_THEME_ORDER.map((theme) => (
            <option key={theme} value={theme}>
              {ANNEX_THEME_METADATA[theme].code} - {ANNEX_THEME_METADATA[theme].shortLabel}
            </option>
          ))}
        </select>

        <select value={applicableFilter} onChange={(event) => setApplicableFilter(event.target.value as typeof applicableFilter)} style={{ border: '1px solid var(--isms-border)', borderRadius: '8px', background: 'var(--isms-bg3)', color: 'var(--isms-txt)', padding: '8px 10px' }}>
          <option value="all">All Applicability</option>
          <option value="yes">Applicable</option>
          <option value="no">Not Applicable</option>
        </select>

        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} style={{ border: '1px solid var(--isms-border)', borderRadius: '8px', background: 'var(--isms-bg3)', color: 'var(--isms-txt)', padding: '8px 10px' }}>
          <option value="all">All Statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ border: '1px solid var(--isms-border)', borderRadius: '12px', background: 'var(--isms-surf)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', fontSize: '11px', color: 'var(--isms-txt3)' }}>
              <th style={{ padding: '10px', borderBottom: '1px solid var(--isms-border)' }}>Control</th>
              <th style={{ padding: '10px', borderBottom: '1px solid var(--isms-border)' }}>Theme</th>
              <th style={{ padding: '10px', borderBottom: '1px solid var(--isms-border)' }}>Applicable</th>
              <th style={{ padding: '10px', borderBottom: '1px solid var(--isms-border)' }}>Status</th>
              <th style={{ padding: '10px', borderBottom: '1px solid var(--isms-border)' }}>Justification</th>
            </tr>
          </thead>
          <tbody>
            {controls.map((control) => {
              const entry = (soaData[control.id] as SoaEntry | undefined) ?? { applicable: true, justification: '' };
              const status = controlStatus[control.id] ?? 'not-started';

              return (
                <tr key={control.id}>
                  <td style={{ padding: '10px', borderBottom: '1px solid var(--isms-border)' }}>
                    <div style={{ fontFamily: '"Fira Code", monospace', fontSize: '11px', color: 'var(--isms-txt3)' }}>{control.id}</div>
                    <div style={{ marginTop: '4px', fontWeight: 600 }}>{control.title}</div>
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid var(--isms-border)' }}>
                    {ANNEX_THEME_METADATA[control.theme].code} - {ANNEX_THEME_METADATA[control.theme].shortLabel}
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid var(--isms-border)' }}>
                    <input
                      type="checkbox"
                      checked={entry.applicable}
                      onChange={(event) => setApplicable(control.id, event.target.checked)}
                    />
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid var(--isms-border)' }}>
                    <select
                      value={status}
                      onChange={(event) => setStatus(control.id, event.target.value as ControlStatus)}
                      disabled={!entry.applicable}
                      style={{
                        border: '1px solid var(--isms-border)',
                        borderRadius: '8px',
                        background: 'var(--isms-bg3)',
                        color: 'var(--isms-txt)',
                        padding: '6px 8px',
                        width: '140px',
                      }}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid var(--isms-border)' }}>
                    <input
                      value={entry.justification || ''}
                      onChange={(event) => setJustification(control.id, event.target.value)}
                      placeholder="Justification"
                      style={{
                        border: '1px solid var(--isms-border)',
                        borderRadius: '8px',
                        background: 'var(--isms-bg3)',
                        color: 'var(--isms-txt)',
                        padding: '6px 8px',
                        width: '100%',
                        minWidth: '220px',
                      }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
