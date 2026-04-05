'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  MANDATORY_DOCUMENTS,
  SUPPORTING_DOCUMENTS,
  POLICY_DOCUMENTS,
} from '@/lib/isms/constants';
import { useIsmsStore } from '@/store/ismsStore';

type DocStatus = 'not-started' | 'in-progress' | 'implemented';

type DocTab = 'mandatory' | 'supporting' | 'policies';

const TAB_MAP = {
  mandatory: MANDATORY_DOCUMENTS,
  supporting: SUPPORTING_DOCUMENTS,
  policies: POLICY_DOCUMENTS,
} as const;

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

export default function DocumentsPage() {
  const workspace = useIsmsStore((state) => state.workspace);
  const loadAll = useIsmsStore((state) => state.loadAll);
  const updateWorkspace = useIsmsStore((state) => state.updateWorkspace);

  const [tab, setTab] = useState<DocTab>('mandatory');

  useEffect(() => {
    if (!workspace) {
      void loadAll();
    }
  }, [workspace, loadAll]);

  const docStatus = workspace?.docStatus ?? {};

  const list = TAB_MAP[tab];

  const stats = useMemo(() => countByStatus(list, docStatus), [list, docStatus]);

  function setDocStatus(ref: string, status: DocStatus) {
    void updateWorkspace({
      docStatus: {
        ...docStatus,
        [ref]: status,
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
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Documentation Register</h2>
        <p style={{ margin: '8px 0 0', color: 'var(--isms-txt2)', fontSize: '13px' }}>
          {stats.complete} Complete | {stats.inProgress} In Progress | {stats.notStarted} Not Started
        </p>
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
              { key: 'mandatory', label: `Mandatory (${MANDATORY_DOCUMENTS.length})` },
              { key: 'supporting', label: `Supporting (${SUPPORTING_DOCUMENTS.length})` },
              { key: 'policies', label: `Policies (${POLICY_DOCUMENTS.length})` },
            ] as const
          ).map((item) => {
            const active = tab === item.key;
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
                {item.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'grid', gap: '8px', padding: '12px' }}>
          {list.map((doc) => {
            const status = (docStatus[doc.ref] as DocStatus | undefined) ?? 'not-started';

            return (
              <div
                key={doc.ref}
                style={{
                  border: '1px solid var(--isms-border)',
                  borderRadius: '8px',
                  background: 'var(--isms-bg3)',
                  padding: '10px',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '10px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{doc.title}</div>
                  <div style={{ color: 'var(--isms-txt3)', fontFamily: '"Fira Code", monospace', fontSize: '11px', marginTop: '4px' }}>
                    {doc.ref} · {doc.clause}
                  </div>
                </div>

                <select
                  value={status}
                  onChange={(event) => setDocStatus(doc.ref, event.target.value as DocStatus)}
                  style={{
                    border: '1px solid var(--isms-border)',
                    borderRadius: '8px',
                    background: 'var(--isms-surf)',
                    color: 'var(--isms-txt)',
                    padding: '6px 8px',
                    fontSize: '12px',
                    minWidth: '120px',
                  }}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
