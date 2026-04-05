'use client';

import { useEffect, useMemo } from 'react';
import { useIsmsStore } from '@/store/ismsStore';
import {
  computeComplianceStats,
  getKpiStatus,
  getRiskLevel,
  getRiskScore,
  getTaskDueStatus,
} from '@/lib/isms/calculations';
import { ANNEX_A_CONTROLS, ISO_CLAUSES } from '@/lib/isms/constants';
import KpiCard from '@/components/isms/shared/KpiCard';
import StatusBadge from '@/components/isms/shared/StatusBadge';
import ProgressBar from '@/components/isms/shared/ProgressBar';

function badgeForKpi(status: ReturnType<typeof getKpiStatus>): 'success' | 'warning' | 'danger' {
  if (status === 'on-target') return 'success';
  if (status === 'below-target') return 'warning';
  return 'danger';
}

function kpiStatusLabel(status: ReturnType<typeof getKpiStatus>): string {
  if (status === 'on-target') return 'On Target';
  if (status === 'below-target') return 'Below Target';
  return 'Critical';
}

function formatDate(value?: string | Date | null): string {
  if (!value) return '-';

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';

  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function clauseStatusVariant(percent: number): 'success' | 'info' | 'warning' {
  if (percent >= 75) return 'success';
  if (percent >= 40) return 'info';
  return 'warning';
}

function clauseStatusLabel(percent: number): 'On Track' | 'In Progress' | 'Attention' {
  if (percent >= 75) return 'On Track';
  if (percent >= 40) return 'In Progress';
  return 'Attention';
}

function complianceTone(percent: number): 'green' | 'blue' | 'amber' | 'red' {
  if (percent >= 75) return 'green';
  if (percent >= 50) return 'blue';
  if (percent >= 30) return 'amber';
  return 'red';
}

function trendLabel(value?: string | null): string {
  const trend = (value || '').toLowerCase();

  if (trend === 'up') return '↑ Improving';
  if (trend === 'down') return '↓ Declining';
  return '→ Stable';
}

function isOpenOrInTreatment(status?: string): boolean {
  return status === 'Open' || status === 'In Treatment';
}

function guidanceText(overallCompliance: number): string {
  if (overallCompliance < 50) {
    return 'Significant work remains before certification readiness. Accelerate resource allocation.';
  }

  if (overallCompliance <= 74) {
    return 'On track with continued effort. Maintain current velocity and focus.';
  }

  return 'Approaching certification readiness. Begin CB engagement and internal audit preparation.';
}

export default function BoardReportPage() {
  const workspace = useIsmsStore((state) => state.workspace);
  const risks = useIsmsStore((state) => state.risks);
  const incidents = useIsmsStore((state) => state.incidents);
  const tasks = useIsmsStore((state) => state.tasks);
  const kpis = useIsmsStore((state) => state.kpis);
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

  const generatedDate = useMemo(() => new Date(), []);

  const activeRisks = useMemo(
    () =>
      risks
        .filter((risk) => isOpenOrInTreatment(risk.status))
        .map((risk) => ({
          ...risk,
          score: getRiskScore(risk.likelihood, risk.impact),
          level: getRiskLevel(getRiskScore(risk.likelihood, risk.impact)),
        })),
    [risks],
  );

  const criticalRisks = useMemo(
    () => activeRisks.filter((risk) => risk.score >= 20).length,
    [activeRisks],
  );

  const openIncidents = useMemo(
    () => incidents.filter((incident) => !['Closed', 'Resolved'].includes(incident.status)).length,
    [incidents],
  );

  const overdueTasks = useMemo(
    () => tasks.filter((task) => task.status !== 'done' && getTaskDueStatus(task.dueDate) === 'overdue').length,
    [tasks],
  );

  const implementedControls = useMemo(
    () => ANNEX_A_CONTROLS.filter((control) => workspace?.controlStatus?.[control.id] === 'implemented').length,
    [workspace],
  );

  const clauseRows = useMemo(
    () =>
      ISO_CLAUSES.filter((clause) => {
        const clauseId = Number(clause.id);
        return clauseId >= 4 && clauseId <= 10;
      }).map((clause) => {
        const implemented = clause.requirements.filter(
          (requirement) => workspace?.clauseStatus?.[requirement.id] === 'implemented',
        ).length;
        const total = clause.requirements.length;
        const percent = compliance.clausePct[clause.id] ?? 0;

        return {
          id: clause.id,
          title: clause.title,
          implemented,
          total,
          percent,
        };
      }),
    [workspace, compliance],
  );

  const riskBreakdown = useMemo(
    () =>
      activeRisks.reduce(
        (acc, risk) => {
          acc[risk.level] += 1;
          return acc;
        },
        { Critical: 0, High: 0, Medium: 0, Low: 0 },
      ),
    [activeRisks],
  );

  const topRiskRows = useMemo(
    () =>
      [...activeRisks]
        .filter((risk) => risk.score >= 10)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5),
    [activeRisks],
  );

  const kpiRows = useMemo(() => [...kpis], [kpis]);

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <div
        style={{
          border: '1px solid var(--isms-border)',
          borderRadius: '12px',
          background: 'var(--isms-surf)',
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Board &amp; Management Report</h2>
          <p style={{ margin: '8px 0 0', color: 'var(--isms-txt2)', fontSize: '13px' }}>
            Executive snapshot of ISMS posture, top risks, and KPI performance.
          </p>
        </div>

        <button
          type='button'
          onClick={() => window.print()}
          style={{
            border: '1px solid var(--isms-border)',
            borderRadius: '8px',
            background: 'var(--isms-bg2)',
            color: 'var(--isms-txt)',
            padding: '8px 12px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '12px',
          }}
        >
          Print / PDF
        </button>
      </div>

      <div
        style={{
          border: '1px solid var(--isms-border)',
          borderRadius: '12px',
          background: 'linear-gradient(120deg, rgba(59,130,246,0.14), rgba(9,14,26,0.84) 72%)',
          padding: '16px',
          display: 'grid',
          gap: '12px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '10px',
            alignItems: 'start',
          }}
        >
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ fontSize: '22px', fontWeight: 700 }}>{workspace?.orgName || 'Not Set'}</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', color: 'var(--isms-txt2)', fontSize: '12px' }}>
              <span>
                {'Board & Management Report · ' +
                  formatDate(generatedDate) +
                  ' · CISO: ' +
                  (workspace?.cisoName || '—') +
                  ' · CB: ' +
                  (workspace?.certBody || 'TBD')}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--isms-txt2)' }}>Overall Compliance</span>
              <StatusBadge variant={clauseStatusVariant(compliance.overallPct)}>{compliance.overallPct}%</StatusBadge>
            </div>
            <ProgressBar value={compliance.overallPct} tone={complianceTone(compliance.overallPct)} height={10} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Executive Summary</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <KpiCard label='Critical Risks' value={criticalRisks} hint='Open / In Treatment (score >= 20)' />
          <KpiCard label='Open Incidents' value={openIncidents} hint='Not closed or resolved' />
          <KpiCard label='Overdue Tasks' value={overdueTasks} hint='Task status not done and due date passed' />
          <KpiCard
            label='Controls Implemented'
            value={`${implementedControls} / ${ANNEX_A_CONTROLS.length}`}
            hint='Annex A controls implemented'
          />
        </div>
      </div>

      <div
        style={{
          border: '1px solid var(--isms-border)',
          borderRadius: '12px',
          background: 'var(--isms-surf)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 16px 8px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Clause Compliance</h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--isms-txt3)', fontSize: '11px' }}>
                <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Cl.</th>
                <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Title</th>
                <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Progress</th>
                <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>%</th>
                <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {clauseRows.map((row) => (
                <tr key={row.id}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', fontFamily: '"Fira Code", monospace' }}>
                    {row.id}
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{row.title}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>
                    <div style={{ minWidth: '180px', display: 'grid', gap: '5px' }}>
                      <ProgressBar value={row.percent} tone={complianceTone(row.percent)} height={8} />
                      <span style={{ color: 'var(--isms-txt3)', fontSize: '11px' }}>
                        {row.implemented}/{row.total} requirements
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', fontFamily: '"Fira Code", monospace' }}>
                    {row.percent}%
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>
                    <StatusBadge variant={clauseStatusVariant(row.percent)}>{clauseStatusLabel(row.percent)}</StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Risk Summary</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
          <KpiCard label='Critical' value={riskBreakdown.Critical} hint='Open / In Treatment' />
          <KpiCard label='High' value={riskBreakdown.High} hint='Open / In Treatment' />
          <KpiCard label='Medium' value={riskBreakdown.Medium} hint='Open / In Treatment' />
          <KpiCard label='Low' value={riskBreakdown.Low} hint='Open / In Treatment' />
        </div>

        {topRiskRows.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--isms-txt3)', fontSize: '11px' }}>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>ID</th>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Risk</th>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Score</th>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Treatment</th>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Owner</th>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Due</th>
                </tr>
              </thead>
              <tbody>
                {topRiskRows.map((risk) => (
                  <tr key={risk.id}>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', fontFamily: '"Fira Code", monospace' }}>
                      {risk.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{risk.title || 'Untitled risk'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>
                      <StatusBadge variant={risk.score >= 20 ? 'danger' : 'warning'}>{risk.score}</StatusBadge>
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{risk.treatment || '-'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{risk.owner || '-'}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{formatDate(risk.targetDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <div
        style={{
          border: '1px solid var(--isms-border)',
          borderRadius: '12px',
          background: 'var(--isms-surf)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 16px 8px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>KPI Performance</h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '780px' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--isms-txt3)', fontSize: '11px' }}>
                <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>KPI</th>
                <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Category</th>
                <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Target</th>
                <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Current</th>
                <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Status</th>
                <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>Trend</th>
              </tr>
            </thead>
            <tbody>
              {kpiRows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '12px', color: 'var(--isms-txt2)' }}>
                    No KPI metrics recorded.
                  </td>
                </tr>
              ) : (
                kpiRows.map((kpi) => {
                  const status = getKpiStatus(kpi);
                  return (
                    <tr key={kpi.id}>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{kpi.name || 'Unnamed KPI'}</td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', color: 'var(--isms-txt2)' }}>{kpi.category || '-'}</td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', fontFamily: '"Fira Code", monospace' }}>
                        {kpi.target}
                        {kpi.unit ? ` ${kpi.unit}` : ''}
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)', fontFamily: '"Fira Code", monospace' }}>
                        {kpi.current}
                        {kpi.unit ? ` ${kpi.unit}` : ''}
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>
                        <StatusBadge variant={badgeForKpi(status)}>{kpiStatusLabel(status)}</StatusBadge>
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--isms-border)' }}>{trendLabel(kpi.trend)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

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
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Decisions &amp; Actions Required</h3>

        <div style={{ display: 'grid', gap: '10px' }}>
          {criticalRisks > 0 ? (
            <div
              style={{
                border: '1px solid rgba(239,68,68,0.45)',
                borderRadius: '10px',
                background: 'rgba(239,68,68,0.1)',
                padding: '10px',
                display: 'grid',
                gap: '5px',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '13px' }}>URGENT: {criticalRisks} Critical Risk(s)</div>
              <div style={{ fontSize: '12px', color: 'var(--isms-txt2)' }}>
                Require immediate management decision on treatment approach and resource allocation.
              </div>
            </div>
          ) : null}

          {overdueTasks > 0 ? (
            <div
              style={{
                border: '1px solid rgba(245,158,11,0.45)',
                borderRadius: '10px',
                background: 'rgba(245,158,11,0.1)',
                padding: '10px',
                display: 'grid',
                gap: '5px',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '13px' }}>ACTION: {overdueTasks} Overdue Implementation Task(s)</div>
              <div style={{ fontSize: '12px', color: 'var(--isms-txt2)' }}>
                Resource or priority adjustment needed. Review task board and confirm revised completion dates.
              </div>
            </div>
          ) : null}

          <div
            style={{
              border: '1px solid rgba(59,130,246,0.45)',
              borderRadius: '10px',
              background: 'rgba(59,130,246,0.1)',
              padding: '10px',
              display: 'grid',
              gap: '5px',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '13px' }}>INFO: Overall Compliance at {compliance.overallPct}%</div>
            <div style={{ fontSize: '12px', color: 'var(--isms-txt2)' }}>{guidanceText(compliance.overallPct)}</div>
          </div>

          <div
            style={{
              border: '1px solid var(--isms-border)',
              borderRadius: '10px',
              background: 'var(--isms-bg3)',
              padding: '10px',
              display: 'grid',
              gap: '5px',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '13px' }}>NEXT: Management Review Agenda Items</div>
            <div style={{ fontSize: '12px', color: 'var(--isms-txt2)' }}>
              IS objectives progress · Risk treatment status · Audit programme planning · KPI review · Continual improvement opportunities.
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          border: '1px solid var(--isms-border)',
          borderRadius: '10px',
          background: 'var(--isms-bg2)',
          padding: '10px 12px',
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          color: 'var(--isms-txt2)',
          fontSize: '12px',
        }}
      >
        <span>Generated: {formatDate(generatedDate)}</span>
        <span>Suite: ISO 27001 CISO Command Suite</span>
        <span>Org: {workspace?.orgName || 'Not Set'}</span>
        <span>Target Cert Date: {formatDate(workspace?.targetDate)}</span>
      </div>
    </div>
  );
}
