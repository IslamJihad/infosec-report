'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { FiCheck, FiClock, FiRotateCcw, FiSearch } from 'react-icons/fi';
import {
  MANDATORY_DOCUMENTS,
  SUPPORTING_DOCUMENTS,
  POLICY_DOCUMENTS,
} from '@/lib/isms/constants';
import { useIsmsStore } from '@/store/ismsStore';
import KpiCard from '@/components/isms/shared/KpiCard';
import ProgressBar from '@/components/isms/shared/ProgressBar';
import StatusBadge from '@/components/isms/shared/StatusBadge';

type DocStatus = 'not-started' | 'in-progress' | 'implemented';

type DocTab = 'mandatory' | 'supporting' | 'policies';

type DocItem = {
  ref: string;
  title: string;
  clause: string;
  tab: DocTab;
};

const TAB_MAP = {
  mandatory: MANDATORY_DOCUMENTS,
  supporting: SUPPORTING_DOCUMENTS,
  policies: POLICY_DOCUMENTS,
} as const;

const ALL_DOCS: DocItem[] = [
  ...MANDATORY_DOCUMENTS.map((doc) => ({ ...doc, tab: 'mandatory' as const })),
  ...SUPPORTING_DOCUMENTS.map((doc) => ({ ...doc, tab: 'supporting' as const })),
  ...POLICY_DOCUMENTS.map((doc) => ({ ...doc, tab: 'policies' as const })),
];

const TAB_LABELS: Record<DocTab, string> = {
  mandatory: 'Mandatory',
  supporting: 'Supporting',
  policies: 'Policies',
};

const STATUS_OPTIONS: Array<{ value: DocStatus; label: string }> = [
  { value: 'not-started', label: 'Not Started' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'implemented', label: 'Complete' },
];

function countByStatus(items: Array<{ ref: string }>, statusMap: Record<string, string>) {
  const complete = items.filter((doc) => statusMap[doc.ref] === 'implemented').length;
  const inProgress = items.filter((doc) => statusMap[doc.ref] === 'in-progress').length;
  const notStarted = items.length - complete - inProgress;
  return { complete, inProgress, notStarted };
}

function asDocStatus(value: string | undefined): DocStatus {
  if (value === 'implemented' || value === 'in-progress' || value === 'not-started') {
    return value;
  }

  return 'not-started';
}

function nextDocStatus(current: DocStatus): DocStatus {
  if (current === 'not-started') {
    return 'in-progress';
  }

  if (current === 'in-progress') {
    return 'implemented';
  }

  return 'not-started';
}

function statusVariant(value: DocStatus): 'neutral' | 'info' | 'success' {
  if (value === 'implemented') return 'success';
  if (value === 'in-progress') return 'info';
  return 'neutral';
}

function statusLabel(value: DocStatus): string {
  if (value === 'implemented') return 'Complete';
  if (value === 'in-progress') return 'In Progress';
  return 'Not Started';
}

function progressTone(value: number): 'red' | 'amber' | 'blue' | 'green' {
  if (value >= 85) return 'green';
  if (value >= 65) return 'blue';
  if (value >= 35) return 'amber';
  return 'red';
}

function fieldStyle(): CSSProperties {
  return {
    border: '1px solid var(--isms-border)',
    borderRadius: '8px',
    background: 'var(--isms-bg3)',
    color: 'var(--isms-txt)',
    padding: '8px 10px',
    fontSize: '13px',
    width: '100%',
  };
}

export default function DocumentsPage() {
  const workspace = useIsmsStore((state) => state.workspace);
  const loadAll = useIsmsStore((state) => state.loadAll);
  const updateWorkspace = useIsmsStore((state) => state.updateWorkspace);

  const [tab, setTab] = useState<DocTab>('mandatory');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DocStatus>('all');
  const [clauseFilter, setClauseFilter] = useState<'all' | string>('all');

  useEffect(() => {
    if (!workspace) {
      void loadAll();
    }
  }, [workspace, loadAll]);

  const docStatus = workspace?.docStatus ?? {};

  const list = TAB_MAP[tab];

  const overallStats = useMemo(() => countByStatus(ALL_DOCS, docStatus), [docStatus]);

  const tabStats = useMemo(
    () => ({
      mandatory: countByStatus(MANDATORY_DOCUMENTS, docStatus),
      supporting: countByStatus(SUPPORTING_DOCUMENTS, docStatus),
      policies: countByStatus(POLICY_DOCUMENTS, docStatus),
    }),
    [docStatus],
  );

  const clauseOptions = useMemo(() => {
    const clauses = new Set(list.map((doc) => doc.clause));
    return Array.from(clauses).sort((a, b) => a.localeCompare(b));
  }, [list]);

  useEffect(() => {
    if (clauseFilter !== 'all' && !clauseOptions.includes(clauseFilter)) {
      setClauseFilter('all');
    }
  }, [clauseFilter, clauseOptions]);

  const filteredDocs = useMemo(
    () =>
      list.filter((doc) => {
        if (query.trim().length > 0) {
          const searchable = `${doc.ref} ${doc.title} ${doc.clause}`.toLowerCase();
          if (!searchable.includes(query.toLowerCase())) {
            return false;
          }
        }

        if (statusFilter !== 'all') {
          const current = asDocStatus(docStatus[doc.ref]);
          if (current !== statusFilter) {
            return false;
          }
        }

        if (clauseFilter !== 'all' && doc.clause !== clauseFilter) {
          return false;
        }

        return true;
      }),
    [clauseFilter, docStatus, list, query, statusFilter],
  );

  const visibleStats = useMemo(() => countByStatus(filteredDocs, docStatus), [filteredDocs, docStatus]);

  const overallProgress = Math.round((overallStats.complete / Math.max(ALL_DOCS.length, 1)) * 100);
  const tabProgress = Math.round((tabStats[tab].complete / Math.max(list.length, 1)) * 100);
  const visibleProgress = Math.round((visibleStats.complete / Math.max(filteredDocs.length, 1)) * 100);

  function setDocStatus(ref: string, status: DocStatus) {
    void updateWorkspace({
      docStatus: {
        ...docStatus,
        [ref]: status,
      },
    });
  }

  function cycleDocStatus(ref: string) {
    const current = asDocStatus(docStatus[ref]);
    setDocStatus(ref, nextDocStatus(current));
  }

  function applyToFiltered(status: DocStatus) {
    if (filteredDocs.length === 0) {
      return;
    }

    const next = { ...docStatus };
    for (const doc of filteredDocs) {
      next[doc.ref] = status;
    }

    void updateWorkspace({ docStatus: next });
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
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Documentation Register</h2>
        <p style={{ margin: '8px 0 10px', color: 'var(--isms-txt2)', fontSize: '13px' }}>
          Mandatory and supporting documented information aligned to Clause 7.5.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11px', color: 'var(--isms-txt3)' }}>
              <span>Overall Completion</span>
              <span style={{ fontFamily: '"Fira Code", monospace' }}>{overallProgress}%</span>
            </div>
            <ProgressBar value={overallProgress} tone={progressTone(overallProgress)} />
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <StatusBadge variant='success'>{overallStats.complete} Complete</StatusBadge>
            <StatusBadge variant='info'>{overallStats.inProgress} In Progress</StatusBadge>
          </div>
        </div>
      </div>

      <div
        style={{
          border: '1px solid var(--isms-border)',
          borderRadius: '12px',
          background: 'var(--isms-surf)',
          padding: '12px',
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr auto auto auto',
          gap: '10px',
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative' }}>
          <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--isms-txt3)' }} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder='Search by reference, title, or clause'
            style={{ ...fieldStyle(), paddingLeft: '30px' }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as 'all' | DocStatus)}
          style={fieldStyle()}
        >
          <option value='all'>All Status</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select value={clauseFilter} onChange={(event) => setClauseFilter(event.target.value)} style={fieldStyle()}>
          <option value='all'>All Clauses</option>
          {clauseOptions.map((clause) => (
            <option key={clause} value={clause}>
              {clause}
            </option>
          ))}
        </select>

        <button
          type='button'
          onClick={() => applyToFiltered('implemented')}
          disabled={filteredDocs.length === 0}
          style={{
            border: '1px solid rgba(34,197,94,0.42)',
            background: 'rgba(34,197,94,0.16)',
            color: 'var(--isms-green)',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 10px',
            cursor: filteredDocs.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          <FiCheck size={14} /> Complete All
        </button>

        <button
          type='button'
          onClick={() => applyToFiltered('in-progress')}
          disabled={filteredDocs.length === 0}
          style={{
            border: '1px solid rgba(59,130,246,0.4)',
            background: 'rgba(59,130,246,0.14)',
            color: 'var(--isms-blue)',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 10px',
            cursor: filteredDocs.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          <FiClock size={14} /> Set In Progress
        </button>

        <button
          type='button'
          onClick={() => applyToFiltered('not-started')}
          disabled={filteredDocs.length === 0}
          style={{
            border: '1px solid var(--isms-border)',
            background: 'var(--isms-bg3)',
            color: 'var(--isms-txt2)',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 10px',
            cursor: filteredDocs.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          <FiRotateCcw size={14} /> Reset
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px' }}>
        <KpiCard label='Total Documents' value={ALL_DOCS.length} hint='Mandatory, supporting, and policy records' />
        <KpiCard label='Active Tab Completion' value={`${tabProgress}%`} hint={`${tabStats[tab].complete} of ${list.length} complete`} />
        <KpiCard label='Filtered Completion' value={`${visibleProgress}%`} hint={`${visibleStats.complete} of ${filteredDocs.length} visible complete`} />
        <KpiCard label='Not Started' value={overallStats.notStarted} hint='Outstanding document items' />
      </div>

      <div
        style={{
          border: '1px solid var(--isms-border)',
          borderRadius: '12px',
          background: 'var(--isms-surf)',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', borderBottom: '1px solid var(--isms-border)' }}>
          {(
            [
              { key: 'mandatory', total: MANDATORY_DOCUMENTS.length },
              { key: 'supporting', total: SUPPORTING_DOCUMENTS.length },
              { key: 'policies', total: POLICY_DOCUMENTS.length },
            ] as const
          ).map((item) => {
            const active = tab === item.key;
            const done = tabStats[item.key].complete;
            return (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  background: active ? 'rgba(59,130,246,0.16)' : 'transparent',
                  color: active ? 'var(--isms-txt)' : 'var(--isms-txt2)',
                  padding: '10px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                {TAB_LABELS[item.key]} ({done}/{item.total})
              </button>
            );
          })}
        </div>

        <div style={{ padding: '12px 12px 10px' }}>
          <div style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11px', color: 'var(--isms-txt3)' }}>
              <span>{TAB_LABELS[tab]} Completion</span>
              <span style={{ fontFamily: '"Fira Code", monospace' }}>{tabProgress}%</span>
            </div>
            <ProgressBar value={tabProgress} tone={progressTone(tabProgress)} />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--isms-txt3)', fontSize: '11px' }}>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', width: '48px' }}>Cycle</th>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Reference</th>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Document</th>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Clause</th>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Status</th>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Update</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '12px', color: 'var(--isms-txt2)' }}>
                      No documents match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map((doc) => {
                    const status = asDocStatus(docStatus[doc.ref]);
                    const mandatory = tab === 'mandatory';

                    return (
                      <tr key={doc.ref}>
                        <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--isms-border)' }}>
                          <button
                            type='button'
                            onClick={() => cycleDocStatus(doc.ref)}
                            title='Cycle status'
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '6px',
                              border: '1px solid var(--isms-border)',
                              background:
                                status === 'implemented'
                                  ? 'rgba(34,197,94,0.16)'
                                  : status === 'in-progress'
                                    ? 'rgba(59,130,246,0.14)'
                                    : 'var(--isms-bg3)',
                              color:
                                status === 'implemented'
                                  ? 'var(--isms-green)'
                                  : status === 'in-progress'
                                    ? 'var(--isms-blue)'
                                    : 'var(--isms-txt3)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {status === 'implemented' ? 'OK' : status === 'in-progress' ? 'IP' : '-'}
                          </button>
                        </td>

                        <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--isms-border)' }}>
                          <div style={{ fontFamily: '"Fira Code", monospace', fontSize: '11px', color: 'var(--isms-txt2)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <span>{doc.ref}</span>
                            {mandatory ? <StatusBadge variant='warning'>Required</StatusBadge> : null}
                          </div>
                        </td>

                        <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--isms-border)', fontWeight: 600 }}>
                          {doc.title}
                        </td>

                        <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--isms-border)', color: 'var(--isms-txt2)', fontFamily: '"Fira Code", monospace', fontSize: '11px' }}>
                          {doc.clause}
                        </td>

                        <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--isms-border)' }}>
                          <StatusBadge variant={statusVariant(status)}>{statusLabel(status)}</StatusBadge>
                        </td>

                        <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--isms-border)', minWidth: '140px' }}>
                          <select
                            value={status}
                            onChange={(event) => setDocStatus(doc.ref, event.target.value as DocStatus)}
                            style={fieldStyle()}
                          >
                            {STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
