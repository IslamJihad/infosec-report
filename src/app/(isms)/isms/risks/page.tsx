'use client';

import { useEffect, useMemo } from 'react';
import { useIsmsStore } from '@/store/ismsStore';
import { getRiskLevel, getRiskScore } from '@/lib/isms/calculations';

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        border: '1px solid var(--isms-border)',
        borderRadius: '10px',
        background: 'var(--isms-surf)',
        padding: '14px',
      }}
    >
      <div style={{ fontFamily: '"Fira Code", monospace', fontSize: '10px', color: 'var(--isms-txt3)' }}>{label}</div>
      <div style={{ marginTop: '6px', fontSize: '26px', fontWeight: 700 }}>{value}</div>
    </div>
  );
}

export default function IsmsRisksPage() {
  const workspace = useIsmsStore((state) => state.workspace);
  const risks = useIsmsStore((state) => state.risks);
  const loadAll = useIsmsStore((state) => state.loadAll);

  useEffect(() => {
    if (!workspace) {
      void loadAll();
    }
  }, [workspace, loadAll]);

  const stats = useMemo(() => {
    const open = risks.filter((risk) => risk.status === 'Open').length;
    const accepted = risks.filter((risk) => risk.status === 'Accepted').length;
    const highPlus = risks.filter((risk) => getRiskScore(risk.likelihood, risk.impact) >= 10).length;

    return {
      total: risks.length,
      open,
      highPlus,
      accepted,
    };
  }, [risks]);

  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px' }}>
        <SummaryCard label="Total Risks" value={stats.total} />
        <SummaryCard label="Open" value={stats.open} />
        <SummaryCard label="High + Critical" value={stats.highPlus} />
        <SummaryCard label="Accepted" value={stats.accepted} />
      </div>

      <div
        style={{
          border: '1px solid var(--isms-border)',
          borderRadius: '12px',
          background: 'var(--isms-surf)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', fontSize: '11px', color: 'var(--isms-txt3)' }}>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Title</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Category</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>L</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>I</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Score</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Level</th>
              <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {risks.map((risk) => {
              const score = getRiskScore(risk.likelihood, risk.impact);
              const level = getRiskLevel(score);

              return (
                <tr key={risk.id}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>
                    {risk.title || 'Untitled risk'}
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', color: 'var(--isms-txt2)' }}>
                    {risk.category || '-'}
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', fontFamily: '"Fira Code", monospace' }}>
                    {risk.likelihood}
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', fontFamily: '"Fira Code", monospace' }}>
                    {risk.impact}
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', fontFamily: '"Fira Code", monospace' }}>
                    {score}
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{level}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{risk.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
