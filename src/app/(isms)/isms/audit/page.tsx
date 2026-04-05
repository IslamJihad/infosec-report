'use client';

import { useEffect, useMemo } from 'react';
import { useIsmsStore } from '@/store/ismsStore';
import KpiCard from '@/components/isms/shared/KpiCard';
import StatusBadge from '@/components/isms/shared/StatusBadge';

export default function AuditPage() {
  const workspace = useIsmsStore((state) => state.workspace);
  const audits = useIsmsStore((state) => state.audits);
  const ncas = useIsmsStore((state) => state.ncas);
  const loadAll = useIsmsStore((state) => state.loadAll);

  useEffect(() => {
    if (!workspace) {
      void loadAll();
    }
  }, [workspace, loadAll]);

  const stats = useMemo(() => {
    const openNcas = ncas.filter((nca) => nca.status !== 'Closed').length;
    const completedAudits = audits.filter((audit) => audit.status === 'Completed').length;

    return {
      audits: audits.length,
      completedAudits,
      ncas: ncas.length,
      openNcas,
    };
  }, [audits, ncas]);

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px' }}>
        <KpiCard label='Audits' value={stats.audits} hint='Planned and completed audits' />
        <KpiCard label='Completed Audits' value={stats.completedAudits} hint='Status completed' />
        <KpiCard label='NCAs' value={stats.ncas} hint='Nonconformities and observations' />
        <KpiCard label='Open NCAs' value={stats.openNcas} hint='Require action tracking' />
      </div>

      <div
        style={{
          border: '1px solid var(--isms-border)',
          borderRadius: '12px',
          background: 'var(--isms-surf)',
          overflowX: 'auto',
        }}
      >
        <div style={{ padding: '14px 14px 4px', fontSize: '16px', fontWeight: 600 }}>Audit Programme</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--isms-txt3)', fontSize: '11px' }}>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Title</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Type</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Date</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Auditor</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {audits.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '12px', color: 'var(--isms-txt2)' }}>
                  No audits recorded.
                </td>
              </tr>
            ) : (
              audits.map((audit) => (
                <tr key={audit.id}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{audit.title || 'Untitled audit'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{audit.auditType}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{audit.auditDate || '-'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', color: 'var(--isms-txt2)' }}>{audit.auditor || '-'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>
                    <StatusBadge variant={audit.status === 'Completed' ? 'success' : audit.status === 'In Progress' ? 'info' : 'warning'}>
                      {audit.status}
                    </StatusBadge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div
        style={{
          border: '1px solid var(--isms-border)',
          borderRadius: '12px',
          background: 'var(--isms-surf)',
          overflowX: 'auto',
        }}
      >
        <div style={{ padding: '14px 14px 4px', fontSize: '16px', fontWeight: 600 }}>Nonconformities and Corrective Actions</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--isms-txt3)', fontSize: '11px' }}>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Reference</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Type</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Owner</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Due Date</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {ncas.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '12px', color: 'var(--isms-txt2)' }}>
                  No NCAs recorded.
                </td>
              </tr>
            ) : (
              ncas.map((nca) => (
                <tr key={nca.id}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', fontFamily: '"Fira Code", monospace' }}>{nca.reference || '-'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{nca.type}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', color: 'var(--isms-txt2)' }}>{nca.owner || '-'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{nca.dueDate || '-'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>
                    <StatusBadge variant={nca.status === 'Closed' ? 'success' : nca.status === 'In Progress' ? 'info' : 'warning'}>
                      {nca.status}
                    </StatusBadge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
