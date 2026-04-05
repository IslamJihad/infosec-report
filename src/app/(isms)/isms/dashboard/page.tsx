'use client';

import { useEffect, useMemo } from 'react';
import { useIsmsStore } from '@/store/ismsStore';
import {
  computeComplianceStats,
  getRiskLevel,
  getRiskScore,
  getTaskDueStatus,
} from '@/lib/isms/calculations';
import {
  MANDATORY_DOCUMENTS,
  POLICY_DOCUMENTS,
  SUPPORTING_DOCUMENTS,
} from '@/lib/isms/constants';

function daysTo(dateText?: string): number | null {
  if (!dateText) return null;
  const target = new Date(dateText);
  if (Number.isNaN(target.getTime())) return null;

  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <div
      style={{
        border: '1px solid var(--isms-border)',
        borderRadius: '12px',
        background: 'var(--isms-surf)',
        padding: '14px 16px',
      }}
    >
      <div
        style={{
          fontFamily: '"Fira Code", monospace',
          fontSize: '10px',
          color: 'var(--isms-txt3)',
          textTransform: 'uppercase',
          letterSpacing: '0.7px',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: '30px', fontWeight: 700, lineHeight: 1.1, marginTop: '8px', color: 'var(--isms-txt)' }}>
        {value}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--isms-txt2)', marginTop: '6px' }}>{sub}</div>
    </div>
  );
}

export default function IsmsDashboardPage() {
  const workspace = useIsmsStore((state) => state.workspace);
  const risks = useIsmsStore((state) => state.risks);
  const incidents = useIsmsStore((state) => state.incidents);
  const tasks = useIsmsStore((state) => state.tasks);
  const loadAll = useIsmsStore((state) => state.loadAll);

  useEffect(() => {
    if (!workspace) {
      void loadAll();
    }
  }, [workspace, loadAll]);

  const compliance = useMemo(
    () => computeComplianceStats(workspace?.clauseStatus ?? {}, workspace?.controlStatus ?? {}),
    [workspace],
  );

  const topRisks = useMemo(
    () =>
      [...risks]
        .sort((a, b) => getRiskScore(b.likelihood, b.impact) - getRiskScore(a.likelihood, a.impact))
        .slice(0, 5),
    [risks],
  );

  const overdueTasks = useMemo(
    () => tasks.filter((task) => task.status !== 'done' && getTaskDueStatus(task.dueDate) === 'overdue').slice(0, 5),
    [tasks],
  );

  const docs = [...MANDATORY_DOCUMENTS, ...SUPPORTING_DOCUMENTS, ...POLICY_DOCUMENTS];
  const implementedDocs = docs.filter((doc) => workspace?.docStatus?.[doc.ref] === 'implemented').length;
  const docsPct = docs.length > 0 ? Math.round((implementedDocs / docs.length) * 100) : 0;

  const openRisks = risks.filter((risk) => risk.status !== 'Closed').length;
  const openIncidents = incidents.filter((incident) => !['Closed', 'Resolved'].includes(incident.status)).length;
  const targetDays = daysTo(workspace?.targetDate);

  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: '12px' }}>
        <StatCard label="Overall Compliance" value={`${compliance.overallPct}%`} sub="Clauses and Annex controls" />
        <StatCard
          label="Clause Completion"
          value={`${compliance.implementedClauses}/${compliance.totalClauses}`}
          sub="Requirements marked implemented"
        />
        <StatCard label="Annex Coverage" value={`${Math.round((compliance.annexPct['5'] + compliance.annexPct['6'] + compliance.annexPct['7'] + compliance.annexPct['8']) / 4)}%`} sub="Average across A.5 to A.8" />
        <StatCard label="Open Risks" value={openRisks} sub="Not closed risks" />
        <StatCard label="Open Incidents" value={openIncidents} sub="Unresolved security incidents" />
        <StatCard label="Days to Target" value={targetDays ?? '-'} sub="Until certification target date" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
        <div
          style={{
            border: '1px solid var(--isms-border)',
            borderRadius: '12px',
            background: 'var(--isms-surf)',
            padding: '16px',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Top Risks</h2>
          <table style={{ width: '100%', marginTop: '12px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--isms-txt3)', fontSize: '11px' }}>
                <th style={{ padding: '8px 6px' }}>Title</th>
                <th style={{ padding: '8px 6px' }}>Owner</th>
                <th style={{ padding: '8px 6px' }}>Score</th>
                <th style={{ padding: '8px 6px' }}>Level</th>
              </tr>
            </thead>
            <tbody>
              {topRisks.map((risk) => {
                const score = getRiskScore(risk.likelihood, risk.impact);
                const level = getRiskLevel(score);

                return (
                  <tr key={risk.id}>
                    <td style={{ padding: '8px 6px', borderTop: '1px solid var(--isms-border)' }}>{risk.title || 'Untitled risk'}</td>
                    <td style={{ padding: '8px 6px', borderTop: '1px solid var(--isms-border)', color: 'var(--isms-txt2)' }}>{risk.owner || '-'}</td>
                    <td style={{ padding: '8px 6px', borderTop: '1px solid var(--isms-border)', fontFamily: '"Fira Code", monospace' }}>{score}</td>
                    <td style={{ padding: '8px 6px', borderTop: '1px solid var(--isms-border)' }}>{level}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'grid', gap: '14px' }}>
          <div
            style={{
              border: '1px solid var(--isms-border)',
              borderRadius: '12px',
              background: 'var(--isms-surf)',
              padding: '16px',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Overdue Tasks</h2>
            <div style={{ marginTop: '10px', display: 'grid', gap: '8px' }}>
              {overdueTasks.length === 0 ? (
                <div style={{ color: 'var(--isms-txt2)', fontSize: '13px' }}>No overdue tasks.</div>
              ) : (
                overdueTasks.map((task) => (
                  <div key={task.id} style={{ padding: '8px', borderRadius: '8px', background: 'var(--isms-bg3)' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{task.title || 'Untitled task'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--isms-txt2)', marginTop: '2px' }}>
                      {task.assignee || 'Unassigned'} · {task.dueDate || 'No due date'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div
            style={{
              border: '1px solid var(--isms-border)',
              borderRadius: '12px',
              background: 'var(--isms-surf)',
              padding: '16px',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Documentation Health</h2>
            <div style={{ fontSize: '32px', fontWeight: 700, marginTop: '10px' }}>{docsPct}%</div>
            <div style={{ color: 'var(--isms-txt2)', fontSize: '12px' }}>
              {implementedDocs}/{docs.length} documents complete
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
