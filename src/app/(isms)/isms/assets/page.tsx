'use client';

import { useEffect, useMemo } from 'react';
import { useIsmsStore } from '@/store/ismsStore';
import KpiCard from '@/components/isms/shared/KpiCard';

export default function AssetsPage() {
  const workspace = useIsmsStore((state) => state.workspace);
  const assets = useIsmsStore((state) => state.assets);
  const loadAll = useIsmsStore((state) => state.loadAll);

  useEffect(() => {
    if (!workspace) {
      void loadAll();
    }
  }, [workspace, loadAll]);

  const stats = useMemo(() => {
    const highCritical = assets.filter((asset) => ['High', 'Critical'].includes(asset.criticality)).length;
    const restricted = assets.filter((asset) => asset.classification === 'Restricted').length;

    return {
      total: assets.length,
      highCritical,
      restricted,
    };
  }, [assets]);

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
        <KpiCard label='Total Assets' value={stats.total} hint='Items in inventory' />
        <KpiCard label='High or Critical' value={stats.highCritical} hint='By criticality field' />
        <KpiCard label='Restricted Data' value={stats.restricted} hint='Restricted classification entries' />
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
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Name</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Type</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Classification</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Criticality</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Owner</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Location</th>
            </tr>
          </thead>
          <tbody>
            {assets.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '12px', color: 'var(--isms-txt2)' }}>
                  No assets recorded.
                </td>
              </tr>
            ) : (
              assets.map((asset) => (
                <tr key={asset.id}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{asset.name || 'Unnamed asset'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', color: 'var(--isms-txt2)' }}>{asset.type}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{asset.classification}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{asset.criticality}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{asset.owner || '-'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{asset.location || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
