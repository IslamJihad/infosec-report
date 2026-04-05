'use client';

import { useEffect, useMemo } from 'react';
import { useIsmsStore } from '@/store/ismsStore';
import KpiCard from '@/components/isms/shared/KpiCard';
import StatusBadge from '@/components/isms/shared/StatusBadge';

export default function SuppliersPage() {
  const workspace = useIsmsStore((state) => state.workspace);
  const suppliers = useIsmsStore((state) => state.suppliers);
  const loadAll = useIsmsStore((state) => state.loadAll);

  useEffect(() => {
    if (!workspace) {
      void loadAll();
    }
  }, [workspace, loadAll]);

  const stats = useMemo(() => {
    const highRisk = suppliers.filter((supplier) => ['High', 'Critical'].includes(supplier.riskLevel)).length;
    const completed = suppliers.filter((supplier) => supplier.assessment === 'Completed' || supplier.assessment === 'Approved').length;

    return {
      total: suppliers.length,
      highRisk,
      completed,
    };
  }, [suppliers]);

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
        <KpiCard label='Total Suppliers' value={stats.total} hint='Third-party inventory' />
        <KpiCard label='High Risk' value={stats.highRisk} hint='High and critical risk levels' />
        <KpiCard label='Assessments Complete' value={stats.completed} hint='Completed or approved assessments' />
      </div>

      <div
        style={{
          border: '1px solid var(--isms-border)',
          borderRadius: '12px',
          background: 'var(--isms-surf)',
          overflowX: 'auto',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--isms-txt3)', fontSize: '11px' }}>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Supplier</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Category</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Risk</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Service</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Next Review</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Assessment</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '12px', color: 'var(--isms-txt2)' }}>
                  No suppliers recorded.
                </td>
              </tr>
            ) : (
              suppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{supplier.name || 'Unnamed supplier'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', color: 'var(--isms-txt2)' }}>{supplier.category || '-'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>
                    <StatusBadge variant={supplier.riskLevel === 'Critical' ? 'danger' : supplier.riskLevel === 'High' ? 'warning' : 'info'}>
                      {supplier.riskLevel}
                    </StatusBadge>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{supplier.service || '-'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{supplier.nextReview || '-'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{supplier.assessment}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
